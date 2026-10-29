// Lodestar's /ask page calls these routes from the browser, so its origin is allowed by name.
// Calling cross-origin rather than through a Lodestar rewrite keeps x-forwarded-for the visitor's
// own address, which is what the per-visitor limits count.
const ORIGINS = (process.env.GRAPHY_ALLOWED_ORIGINS ?? "https://www.lodestar-dashboard.com,https://lodestar-dashboard.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function allowed(req: Request): string | null {
  const o = req.headers.get("origin");
  return o && ORIGINS.includes(o) ? o : null;
}

export function withCors(req: Request, res: Response): Response {
  res.headers.append("vary", "origin");
  const o = allowed(req);
  if (o) res.headers.set("access-control-allow-origin", o);
  return res;
}

export function preflight(req: Request): Response {
  const res = new Response(null, { status: 204 });
  const o = allowed(req);
  if (o) {
    res.headers.set("access-control-allow-origin", o);
    res.headers.set("access-control-allow-methods", "POST, OPTIONS");
    res.headers.set("access-control-allow-headers", "content-type, x-user-key");
    res.headers.set("access-control-max-age", "600");
  }
  res.headers.append("vary", "origin");
  return res;
}
