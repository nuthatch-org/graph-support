import Anthropic from "@anthropic-ai/sdk";
import { KB } from "@/lib/kb.generated";
import { PERSONA } from "@/lib/prompt";
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
const MODEL = "claude-sonnet-5-5";
const MAX_CONTINUATIONS = 2;

const system: Anthropic.Beta.BetaTextBlockParam[] = [
  { type: "text", text: PERSONA },
  { type: "text", text: `<knowledge_base>\n${KB}\n</knowledge_base>`, cache_control: { type: "ephemeral", ttl: "1h" } },
];

const tools: Anthropic.Beta.BetaToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 3 },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3, max_content_tokens: 8000 },
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

  let body: { question?: unknown; conversationId?: unknown };
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
  const ownKey = req.headers.get("x-anthropic-key")?.trim() || "";
  if (ownKey && !/^sk-ant-[\w-]{20,}$/.test(ownKey)) return reply(400, "That doesn't look like an Anthropic API key.", "key");
  let quota: Quota | null = null;
  if (ownKey) {
    const limited = await checkByoRate(ip);
    if (limited) return reply(429, limited);
  } else {
    if (!(await budgetLeft())) {
      return reply(429, "Graphy has burned today's fuel. The tanks refill at midnight UTC, or bring your own API key.", "rate");
    }
    const r = await checkRate(ip);
    if (!r.ok) return reply(429, r.message, "rate");
    quota = r.quota;
  }
  const client = ownKey ? new Anthropic({ apiKey: ownKey, maxRetries: 0 }) : house;

  const conversationId =
    typeof body.conversationId === "string" && /^[0-9a-f-]{36}$/.test(body.conversationId)
      ? body.conversationId
      : crypto.randomUUID();
  const convo: Conversation = (await loadConversation(conversationId)) ?? { messages: [], turns: 0, contextTokens: 0 };
  if (convo.turns >= LIMITS.maxTurns || convo.contextTokens >= LIMITS.maxContextTokens) {
    return reply(409, "This conversation is out of oxygen. Start a new one and give Graphy the key details again.", "full");
  }
  if (!(await acquire(ip))) return reply(429, "Graphy is still answering your last question.");

  const messages: Anthropic.Beta.BetaMessageParam[] = [...convo.messages, { role: "user", content: question }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: Event) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      let spent = 0;
      try {
        const assistant: Anthropic.Beta.BetaContentBlockParam[] = [];
        let final: Anthropic.Beta.BetaMessage | null = null;

        for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
          const history: Anthropic.Beta.BetaMessageParam[] = assistant.length
            ? [...messages, { role: "assistant", content: assistant }]
            : messages;
          const s = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 4096,
              system,
              tools,
              messages: history,
              cache_control: { type: "ephemeral" },
              output_config: { effort: "medium" },
            },
            { signal: req.signal },
          );
          for await (const ev of s) {
            if (ev.type === "content_block_start" && ev.content_block.type === "server_tool_use") {
              send({ t: "status", v: ev.content_block.name === "web_search" ? "searching the web" : "reading a page" });
            } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              send({ t: "text", v: ev.delta.text });
            }
          }
          final = await s.finalMessage();
          if (!ownKey) spent += costUsd(final.usage);
          assistant.push(...(final.content as Anthropic.Beta.BetaContentBlockParam[]));
          if (final.stop_reason !== "pause_turn") break;
        }

        if (!final || final.stop_reason === "refusal") {
          send({ t: "error", v: "Graphy's helmet fogged up on that one and can't answer it. Try rephrasing." });
          return;
        }
        if (final.stop_reason === "max_tokens") send({ t: "text", v: "\n\n(Graphy ran out of breath there. Ask for the rest.)" });

        const u = final.usage;
        const next: Conversation = {
          messages: [...messages, { role: "assistant", content: assistant }],
          turns: convo.turns + 1,
          contextTokens:
            u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + u.output_tokens,
        };
        await saveConversation(conversationId, next);
        const closed = next.turns >= LIMITS.maxTurns || next.contextTokens >= LIMITS.maxContextTokens;
        send({ t: "done", conversationId, turnsLeft: Math.max(0, LIMITS.maxTurns - next.turns), closed, quota });
      } catch (err) {
        if (ownKey && (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)) {
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
