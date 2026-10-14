// Visitor-key providers. Anthropic keys use the Anthropic SDK in the ask route; OpenAI and xAI both
// speak the OpenAI chat-completions protocol, handled here with plain fetch.
import { CLIENT_TOOLS, TOOL_LABEL, runTool } from "./tools";

export type Provider = "anthropic" | "openai" | "xai";

export function providerFor(key: string): Provider | null {
  if (/^sk-ant-[\w-]{20,}$/.test(key)) return "anthropic";
  if (/^xai-[\w-]{20,}$/.test(key)) return "xai";
  if (/^sk-[\w-]{20,}$/.test(key)) return "openai";
  return null;
}

export const BASE: Record<"openai" | "xai", string> = {
  openai: "https://api.openai.com/v1",
  xai: "https://api.x.ai/v1",
};

export const ANTHROPIC_MODELS = [
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (default)" },
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (deeper, about twice the cost)" },
];

// Chat models only; the providers' lists also carry embeddings, audio, image and moderation models.
const CHAT = {
  openai: (id: string) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/(audio|realtime|image|tts|transcribe|search|embedding|instruct|mini-tts)/.test(id),
  xai: (id: string) => /^grok-/.test(id) && !/(image|vision-beta|imagine)/.test(id),
};

export async function listModels(provider: "openai" | "xai", key: string) {
  const r = await fetch(`${BASE[provider]}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
  if (r.status === 401 || r.status === 403) return { ok: false as const, status: r.status };
  if (!r.ok) return { ok: false as const, status: r.status };
  const j = (await r.json()) as { data: { id: string; created?: number }[] };
  const models = j.data
    .filter((m) => CHAT[provider](m.id))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    .slice(0, 12)
    .map((m) => ({ id: m.id, label: m.id }));
  return { ok: true as const, models };
}

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

const FUNCTIONS = CLIENT_TOOLS.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

export class ProviderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Runs one question to completion: streams text through send, executes tool calls, and returns the
// messages this turn added so the conversation can be stored.
export async function askOpenAICompat(opts: {
  provider: "openai" | "xai";
  key: string;
  model: string;
  system: string;
  history: ChatMessage[];
  send: (e: { t: "text" | "status"; v: string }) => void;
  signal: AbortSignal;
  maxSteps: number;
}): Promise<ChatMessage[]> {
  const turn: ChatMessage[] = [];
  for (let step = 0; step < opts.maxSteps; step++) {
    const last = step === opts.maxSteps - 1;
    const r = await fetch(`${BASE[opts.provider]}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${opts.key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: opts.model,
        stream: true,
        messages: [{ role: "system", content: opts.system }, ...opts.history, ...turn],
        tools: FUNCTIONS,
        tool_choice: last ? "none" : "auto",
      }),
      signal: opts.signal,
    });
    if (!r.ok || !r.body) {
      const body = await r.text().catch(() => "");
      let msg = body.slice(0, 300);
      try {
        msg = JSON.parse(body).error?.message ?? msg;
      } catch {}
      throw new ProviderError(r.status, msg);
    }

    let text = "";
    const calls: { id: string; name: string; args: string }[] = [];
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        let chunk: { choices?: { delta?: { content?: string | null; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[] };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        const d = chunk.choices?.[0]?.delta;
        if (!d) continue;
        if (d.content) {
          text += d.content;
          opts.send({ t: "text", v: d.content });
        }
        for (const tc of d.tool_calls ?? []) {
          const c = (calls[tc.index] ??= { id: "", name: "", args: "" });
          if (tc.id) c.id = tc.id;
          if (tc.function?.name) {
            c.name += tc.function.name;
            opts.send({ t: "status", v: TOOL_LABEL[c.name] ?? "working" });
          }
          if (tc.function?.arguments) c.args += tc.function.arguments;
        }
      }
    }

    const real = calls.filter(Boolean);
    turn.push({
      role: "assistant",
      content: text || null,
      ...(real.length ? { tool_calls: real.map((c) => ({ id: c.id, type: "function" as const, function: { name: c.name, arguments: c.args } })) } : {}),
    });
    if (!real.length) break;

    const results = await Promise.all(
      real.map(async (c) => {
        let input: Record<string, unknown>;
        try {
          input = JSON.parse(c.args || "{}");
        } catch {
          return { role: "tool" as const, tool_call_id: c.id, content: "Arguments were not valid JSON. Retry the call." };
        }
        const res = await runTool(c.name, input);
        return { role: "tool" as const, tool_call_id: c.id, content: res.text };
      }),
    );
    turn.push(...results);
  }
  return turn;
}
