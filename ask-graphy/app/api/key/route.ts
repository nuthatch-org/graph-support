import Anthropic from "@anthropic-ai/sdk";
import { checkByoRate } from "@/lib/limits";

export const runtime = "nodejs";

// Checks a visitor's key with a free models lookup before they rely on it. Nothing is stored.
export async function POST(req: Request) {
  const key = req.headers.get("x-anthropic-key")?.trim() || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const json = (ok: boolean, message: string) => Response.json({ ok, message });

  if (!/^sk-ant-[\w-]{20,}$/.test(key)) return json(false, "That doesn't look like an Anthropic API key. They start with sk-ant-.");
  const limited = await checkByoRate(ip);
  if (limited) return json(false, limited);

  try {
    await new Anthropic({ apiKey: key, maxRetries: 0 }).models.retrieve("claude-sonnet-5-5");
    return json(true, "Key works. Graphy's limits no longer apply to you.");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return json(false, "Anthropic refused that key. Check you copied all of it.");
    if (err instanceof Anthropic.PermissionDeniedError || err instanceof Anthropic.NotFoundError) {
      return json(false, "That key can't use Claude Sonnet 5.5.");
    }
    if (err instanceof Anthropic.BadRequestError) return json(false, `Anthropic says: ${err.message}`);
    return json(false, "Couldn't reach Anthropic to check the key. Try again.");
  }
}
