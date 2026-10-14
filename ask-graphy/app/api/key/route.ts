import Anthropic from "@anthropic-ai/sdk";
import { checkByoRate } from "@/lib/limits";
import { ANTHROPIC_MODELS, listModels, providerFor } from "@/lib/providers";

export const runtime = "nodejs";

const NAMES = { anthropic: "Claude", openai: "ChatGPT", xai: "Grok" };

// Checks a visitor's key with a free model listing, and returns the models it can use. Nothing is stored.
export async function POST(req: Request) {
  const key = (req.headers.get("x-user-key") ?? req.headers.get("x-anthropic-key"))?.trim() || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const fail = (message: string) => Response.json({ ok: false, message });

  const provider = providerFor(key);
  if (!provider) return fail("That doesn't look like an API key. Claude keys start sk-ant-, OpenAI keys sk-, Grok keys xai-.");
  const limited = await checkByoRate(ip);
  if (limited) return fail(limited);

  if (provider === "anthropic") {
    try {
      await new Anthropic({ apiKey: key, maxRetries: 0 }).models.retrieve("claude-sonnet-5-5");
      return Response.json({ ok: true, provider, message: "Claude key works. Graphy's limits no longer apply to you.", models: ANTHROPIC_MODELS });
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return fail("Anthropic refused that key. Check you copied all of it.");
      if (err instanceof Anthropic.PermissionDeniedError || err instanceof Anthropic.NotFoundError) return fail("That key can't use Claude Sonnet 5.5.");
      if (err instanceof Anthropic.BadRequestError) return fail(`Anthropic says: ${err.message}`);
      return fail("Couldn't reach Anthropic to check the key. Try again.");
    }
  }

  try {
    const r = await listModels(provider, key);
    if (!r.ok) return fail(r.status === 401 || r.status === 403 || (provider === "xai" && r.status === 400) ? `${NAMES[provider]} refused that key. Check you copied all of it.` : `${NAMES[provider]} returned HTTP ${r.status}. Try again.`);
    if (!r.models.length) return fail(`That ${NAMES[provider]} key has no chat models available.`);
    return Response.json({
      ok: true,
      provider,
      message: `${NAMES[provider]} key works. Pick a model; web search is Claude-only, everything else is the same.`,
      models: r.models,
    });
  } catch {
    return fail(`Couldn't reach ${NAMES[provider]} to check the key. Try again.`);
  }
}
