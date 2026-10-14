import Anthropic from "@anthropic-ai/sdk";
import { KB } from "@/lib/kb.generated";
import { PERSONA } from "@/lib/prompt";
import { CLIENT_TOOLS, TOOL_LABEL, runTool } from "@/lib/tools";
import { ANTHROPIC_MODELS, ProviderError, askOpenAICompat, providerFor, type ChatMessage } from "@/lib/providers";
import {
  LIMITS,
  acquire,
  budgetLeft,
  checkByoRate,
  checkRate,
  costUsd,
  loadConversation,
  recordSpend,
  release,
  type Quota,
  redis,
  saveConversation,
  type Conversation,
} from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 120;

// The house key is user-scoped, so it has to name the workspace whose spend limit applies.
const house = new Anthropic({
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } : undefined,
});
const HOUSE_MODEL = "claude-sonnet-5-5";
// Models a visitor's Anthropic key may choose; all support the server tools Graphy declares.
const BYO_MODELS = ANTHROPIC_MODELS.map((m) => m.id);
const MODEL_ID = /^[\w.:-]{2,80}$/;

const system: Anthropic.Beta.BetaTextBlockParam[] = [
  { type: "text", text: PERSONA },
  { type: "text", text: `<knowledge_base>\n${KB}\n</knowledge_base>`, cache_control: { type: "ephemeral", ttl: "1h" } },
];

const tools: Anthropic.Beta.BetaToolUnion[] = [
  ...CLIENT_TOOLS,
  { type: "web_search_20260209", name: "web_search", max_uses: 4 },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 4, max_content_tokens: 8000 },
];

type Event =
  | { t: "text"; v: string }
  | { t: "status"; v: string }
  | { t: "done"; conversationId: string; turnsLeft: number; closed: boolean; quota: Quota | null }
  | { t: "error"; v: string; code?: "rate" | "key" | "full" };

function reply(status: number, v: string, code?: "rate" | "key" | "full") {
  return new Response(JSON.stringify({ t: "error", v, code } satisfies Event) + "\n", {
    status,
    headers: { "content-type": "application/x-ndjson" },
  });
}

export async function POST(req: Request) {
  if (!redis && process.env.NODE_ENV === "production") {
    return reply(503, "Graphy's mission control is not wired up yet.");
  }

  let body: { question?: unknown; conversationId?: unknown; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, "That transmission was garbled.");
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return reply(400, "Ask Graphy something first.");
  if (question.length > LIMITS.maxQuestionChars) {
    return reply(400, `Shorter, please: ${LIMITS.maxQuestionChars} characters at most. Paste the error, not the whole log.`);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // A visitor's own key is used for this request only: never logged, never stored.
  const ownKey = (req.headers.get("x-user-key") ?? req.headers.get("x-anthropic-key"))?.trim() || "";
  const provider = ownKey ? providerFor(ownKey) : "anthropic";
  if (!provider) return reply(400, "That doesn't look like an Anthropic, OpenAI or xAI API key.", "key");
  if (!(await acquire(ip))) return reply(429, "Graphy is still answering your last question.");
  const refuse = async (status: number, v: string, code?: "rate" | "key" | "full") => {
    await release(ip);
    return reply(status, v, code);
  };
  let quota: Quota | null = null;
  if (ownKey) {
    const limited = await checkByoRate(ip);
    if (limited) return refuse(429, limited);
  } else {
    if (!(await budgetLeft())) {
      return refuse(429, "Graphy has burned today's fuel. The tanks refill at midnight UTC, or bring your own API key.", "rate");
    }
    const r = await checkRate(ip);
    if (!r.ok) return refuse(429, r.message, "rate");
    quota = r.quota;
  }
  const client = ownKey ? new Anthropic({ apiKey: ownKey, maxRetries: 0 }) : house;
  const asked = typeof body.model === "string" ? body.model : "";
  const model =
    provider === "anthropic"
      ? ownKey && BYO_MODELS.includes(asked) ? asked : HOUSE_MODEL
      : MODEL_ID.test(asked) ? asked : "";
  if (!model) return refuse(400, "Pick a model for your key first.", "key");

  const conversationId =
    typeof body.conversationId === "string" && /^[0-9a-f-]{36}$/.test(body.conversationId)
      ? body.conversationId
      : crypto.randomUUID();
  const stored = await loadConversation(conversationId);
  // Message formats differ between providers, so switching provider starts a fresh conversation.
  const convo: Conversation =
    stored && (stored.provider ?? "anthropic") === provider ? stored : { provider, messages: [], turns: 0, contextTokens: 0 };
  if (convo.turns >= LIMITS.maxTurns || convo.contextTokens >= LIMITS.maxContextTokens) {
    return refuse(409, "This conversation is out of oxygen. Start a new one and give Graphy the key details again.", "full");
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = [...convo.messages, { role: "user", content: question }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: Event) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      let spent = 0;
      try {
        if (provider !== "anthropic") {
          const history = convo.messages as unknown as ChatMessage[];
          const added = await askOpenAICompat({
            provider,
            key: ownKey,
            model,
            system: `${PERSONA}\n\nOn this model web_search and web_fetch are not available; use the other tools.\n\n<knowledge_base>\n${KB}\n</knowledge_base>`,
            history: [...history, { role: "user", content: question }],
            send,
            signal: req.signal,
            maxSteps: 14,
          });
          const all = [...history, { role: "user", content: question } as ChatMessage, ...added];
          const next: Conversation = {
            provider,
            messages: all as unknown as Anthropic.Beta.BetaMessageParam[],
            turns: convo.turns + 1,
            contextTokens: Math.round(JSON.stringify(all).length / 4),
          };
          await saveConversation(conversationId, next);
          const closed = next.turns >= LIMITS.maxTurns || next.contextTokens >= LIMITS.maxContextTokens;
          send({ t: "done", conversationId, turnsLeft: Math.max(0, LIMITS.maxTurns - next.turns), closed, quota });
          return;
        }

        // One question can take several model calls: tool round trips and server-side pauses.
        const turn: Anthropic.Beta.BetaMessageParam[] = [];
        let final: Anthropic.Beta.BetaMessage | null = null;
        const maxSteps = ownKey ? 14 : 9;

        for (let step = 0; step < maxSteps; step++) {
          const last = step === maxSteps - 1;
          const s = client.beta.messages.stream(
            {
              model,
              max_tokens: 8192,
              system,
              tools,
              tool_choice: last ? { type: "none" } : { type: "auto" },
              messages: [...messages, ...turn],
              cache_control: { type: "ephemeral" },
              output_config: { effort: ownKey ? "high" : "medium" },
            },
            { signal: req.signal },
          );
          for await (const ev of s) {
            if (ev.type === "content_block_start" && (ev.content_block.type === "server_tool_use" || ev.content_block.type === "tool_use")) {
              send({ t: "status", v: TOOL_LABEL[ev.content_block.name] ?? "working" });
            } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              send({ t: "text", v: ev.delta.text });
            }
          }
          final = await s.finalMessage();
          if (!ownKey) spent += costUsd(final.usage);
          const content = final.content as Anthropic.Beta.BetaContentBlockParam[];

          // A paused turn resumes as the same assistant message.
          const prev = turn[turn.length - 1];
          if (prev?.role === "assistant" && Array.isArray(prev.content)) prev.content.push(...content);
          else turn.push({ role: "assistant", content });

          if (final.stop_reason === "pause_turn") continue;
          if (final.stop_reason !== "tool_use") break;

          const calls = final.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          const results = await Promise.all(
            calls.map(async (c) => {
              const r = await runTool(c.name, c.input as Record<string, unknown>);
              return { type: "tool_result" as const, tool_use_id: c.id, content: r.text, is_error: r.error || undefined };
            }),
          );
          turn.push({ role: "user", content: results });
        }

        if (!final || final.stop_reason === "refusal") {
          send({ t: "error", v: "Graphy's helmet fogged up on that one and can't answer it. Try rephrasing." });
          return;
        }
        if (final.stop_reason === "max_tokens") send({ t: "text", v: "\n\n(Graphy ran out of breath there. Ask for the rest.)" });

        const u = final.usage;
        const next: Conversation = {
          provider,
          messages: [...messages, ...turn],
          turns: convo.turns + 1,
          contextTokens:
            u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + u.output_tokens,
        };
        await saveConversation(conversationId, next);
        const closed = next.turns >= LIMITS.maxTurns || next.contextTokens >= LIMITS.maxContextTokens;
        send({ t: "done", conversationId, turnsLeft: Math.max(0, LIMITS.maxTurns - next.turns), closed, quota });
      } catch (err) {
        if (err instanceof ProviderError) {
          const v =
            err.status === 401 || err.status === 403
              ? "Your API key was refused. Check it, or clear it to use Graphy's own (rate limited)."
              : err.status === 429
                ? "Your provider rate limited or ran out of credit on that key."
                : `Your provider refused the request: ${err.message}`;
          send({ t: "error", v, code: err.status === 401 || err.status === 403 ? "key" : undefined });
        } else if (ownKey && (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)) {
          send({ t: "error", v: "Your API key was refused. Check it, or clear it to use Graphy's own (rate limited).", code: "key" });
        } else if (ownKey && err instanceof Anthropic.BadRequestError) {
          send({ t: "error", v: `Your key's account refused the request: ${err.message}` });
        } else if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
          send({ t: "error", v: "Mission control is busy. Try again in a minute." });
        } else if (err instanceof Anthropic.APIError) {
          console.error("anthropic", err.status, ownKey ? "(visitor key)" : err.message);
          send({ t: "error", v: "Graphy lost the signal. Try again." });
        } else if (!req.signal.aborted) {
          console.error(err);
          send({ t: "error", v: "Graphy lost the signal. Try again." });
        }
      } finally {
        await recordSpend(spent).catch((e) => console.error("spend", e));
        await release(ip).catch((e) => console.error("release", e));
        if (!ownKey) console.log(`turn cost $${spent.toFixed(4)}`);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
