import type Anthropic from "@anthropic-ai/sdk";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import library from "./library.generated.json";

type Lib = { built: string; docs: { id: string; source: string; title: string; url: string | null; sha: string; text: string }[]; chunks: { doc: number; text: string }[] };
const LIB = library as Lib;

const MAX = 16_000;
const clip = (s: string, n = MAX) => (s.length > n ? s.slice(0, n) + `\n…[truncated, ${s.length - n} more chars]` : s);

// --- library search: BM25 over heading-sized sections, built once per cold start ---

const tokenize = (s: string) => s.toLowerCase().match(/[a-z0-9_.]{2,}/g) ?? [];
let index: { tf: Map<string, number>[]; len: number[]; df: Map<string, number>; avg: number } | null = null;

function buildIndex() {
  const tf: Map<string, number>[] = [];
  const len: number[] = [];
  const df = new Map<string, number>();
  for (const c of LIB.chunks) {
    const t = tokenize(LIB.docs[c.doc].title + " " + c.text);
    const m = new Map<string, number>();
    for (const w of t) m.set(w, (m.get(w) ?? 0) + 1);
    for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);
    tf.push(m);
    len.push(t.length);
  }
  index = { tf, len, df, avg: len.reduce((a, b) => a + b, 0) / len.length };
  return index;
}

function searchLibrary(query: string, limit = 6) {
  const ix = index ?? buildIndex();
  const N = ix.tf.length;
  const q = [...new Set(tokenize(query))];
  const scores = ix.tf.map((m, i) => {
    let s = 0;
    for (const w of q) {
      const f = m.get(w);
      if (!f) continue;
      const idf = Math.log(1 + (N - (ix.df.get(w) ?? 0) + 0.5) / ((ix.df.get(w) ?? 0) + 0.5));
      s += (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (ix.len[i] / ix.avg)));
    }
    return s;
  });
  const seen = new Set<number>();
  const hits = scores
    .map((s, i) => [s, i] as const)
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .filter(([, i]) => (seen.has(i) ? false : (seen.add(i), true)))
    .slice(0, limit);
  if (!hits.length) return "No matches in the library. Try other words, the exact error text, or web search.";
  return hits
    .map(([, i]) => {
      const c = LIB.chunks[i];
      const d = LIB.docs[c.doc];
      return `### ${d.title}\ndoc_id: ${d.id}\nsource: ${d.source}${d.url ? ` (${d.url})` : " (private notes)"}\n\n${clip(c.text, 2500)}`;
    })
    .join("\n\n---\n\n");
}

function readLibrary(id: string) {
  const d = LIB.docs.find((x) => x.id === id);
  if (!d) return `No document with doc_id ${id}. Use search_library to find one.`;
  return `# ${d.title}\nsource: ${d.source}${d.url ? ` (${d.url})` : ""}\n\n${clip(d.text, 30_000)}`;
}

// --- GitHub ---

const OWNERS = ["graphprotocol", "edgeandnode", "streamingfast", "PaulieB14", "nuthatch-org", "cargopete"];
const okRepo = (repo: string) => /^[\w.-]+\/[\w.-]+$/.test(repo) && OWNERS.includes(repo.split("/")[0]);
const gh = (extra: Record<string, string> = {}) => ({
  "user-agent": "ask-graphy",
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  ...extra,
});

async function readGithubFile(i: { repo: string; path: string; ref?: string; start_line?: number; end_line?: number }) {
  if (!okRepo(i.repo)) return `Only repos under ${OWNERS.join(", ")} can be read.`;
  const ref = i.ref || "HEAD";
  const r = await fetch(`https://raw.githubusercontent.com/${i.repo}/${encodeURIComponent(ref)}/${i.path.replace(/^\//, "")}`, { headers: { "user-agent": "ask-graphy" } });
  if (!r.ok) return `HTTP ${r.status} for ${i.repo}/${i.path}@${ref}. Check the path with search_github_code, or the repo may be private.`;
  const lines = (await r.text()).split("\n");
  const from = Math.max(1, i.start_line ?? 1);
  const to = Math.min(lines.length, i.end_line ?? from + 399);
  const body = lines.slice(from - 1, to).map((l, k) => `${from + k}\t${l}`).join("\n");
  return clip(`${i.repo}/${i.path}@${ref}, lines ${from}-${to} of ${lines.length}\n${body}`);
}

async function searchGithubCode(i: { repo: string; query: string }) {
  if (!okRepo(i.repo)) return `Only repos under ${OWNERS.join(", ")} can be searched.`;
  if (!process.env.GITHUB_TOKEN) return "Code search is not configured. Use read_github_file with a known path, search_library, or web search.";
  const q = encodeURIComponent(`${i.query} repo:${i.repo}`);
  const r = await fetch(`https://api.github.com/search/code?q=${q}&per_page=8`, { headers: gh({ accept: "application/vnd.github.text-match+json" }) });
  if (!r.ok) return `GitHub code search returned HTTP ${r.status}. Try again shortly or use another tool.`;
  const j = (await r.json()) as { total_count: number; items: { path: string; text_matches?: { fragment: string }[] }[] };
  if (!j.items.length) return `No code matches for "${i.query}" in ${i.repo}. GitHub search matches whole tokens; try a shorter or exact string.`;
  return clip(
    `${j.total_count} matches in ${i.repo} (default branch):\n\n` +
      j.items.map((it) => `${it.path}\n${(it.text_matches ?? []).map((m) => "  " + m.fragment.replace(/\n/g, "\n  ")).join("\n  …\n")}`).join("\n\n"),
  );
}

async function listReleases(i: { repo: string }) {
  if (!okRepo(i.repo)) return `Only repos under ${OWNERS.join(", ")}.`;
  const r = await fetch(`https://github.com/${i.repo}/releases.atom`, { headers: { "user-agent": "ask-graphy" } });
  if (!r.ok) return `HTTP ${r.status} fetching releases for ${i.repo}.`;
  const xml = await r.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 12).map((m) => {
    const e = m[1];
    const t = e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const d = e.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.slice(0, 10) ?? "";
    const link = e.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const body = (e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `${d}  ${t}  ${link}\n  ${body.slice(0, 600)}`;
  });
  return entries.length ? `Latest releases of ${i.repo} (newest first):\n\n${entries.join("\n\n")}` : `No releases found for ${i.repo}.`;
}

// --- networks registry ---

let registry: { at: number; data: { version: string; updatedAt: string; networks: Record<string, unknown>[] } } | null = null;

async function chainRegistry(i: { chain: string }) {
  if (!registry || Date.now() - registry.at > 3_600_000) {
    const r = await fetch("https://networks-registry.thegraph.com/TheGraphNetworksRegistry.json");
    if (!r.ok) return `Registry fetch failed: HTTP ${r.status}.`;
    registry = { at: Date.now(), data: await r.json() };
  }
  const q = i.chain.toLowerCase();
  const nets = registry.data.networks;
  const exact = nets.filter((n) => [n.id, n.caip2Id, ...((n.aliases as string[]) ?? [])].map((x) => String(x).toLowerCase()).includes(q));
  const hits = exact.length ? exact : nets.filter((n) => JSON.stringify([n.id, n.fullName, n.shortName, n.aliases]).toLowerCase().includes(q)).slice(0, 5);
  if (!hits.length) return `No network matching "${i.chain}" in registry ${registry.data.version}.`;
  return clip(`Networks registry ${registry.data.version} (updated ${registry.data.updatedAt}):\n` + hits.map((h) => JSON.stringify(h, null, 1)).join("\n"), 12_000);
}

// --- indexer /status, guarded: public https hosts only ---

function privateAddr(ip: string) {
  if (isIP(ip) === 6) return /^(::1|f[cd]|fe80|::ffff:(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip) || ip === "::";
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function indexerStatus(i: { status_url: string; deployments: string[] }) {
  let u: URL;
  try {
    u = new URL(i.status_url);
  } catch {
    return "That is not a URL.";
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return "Only plain https URLs on the default port.";
  if (!/\/status\/?$/.test(u.pathname)) u.pathname = u.pathname.replace(/\/?$/, "/status");
  const addrs = await lookup(u.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => privateAddr(a.address))) return "That host does not resolve to a public address.";
  const ids = i.deployments.filter((d) => /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(d)).slice(0, 5);
  if (!ids.length) return "Give one to five deployment IDs (Qm…).";
  const query = `{ indexingStatuses(subgraphs: ${JSON.stringify(ids)}) { subgraph synced health paused node fatalError { message deterministic block { number } } nonFatalErrors { message } chains { network chainHeadBlock { number } latestBlock { number } earliestBlock { number } } } }`;
  const r = await fetch(u, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "ask-graphy" },
    body: JSON.stringify({ query }),
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  }).catch((e: Error) => e);
  if (r instanceof Error) return `Request failed: ${r.message}`;
  return clip(`HTTP ${r.status} from ${u.origin}${u.pathname}\n${await r.text()}`, 8000);
}

// --- definitions ---

const str = { type: "string" } as const;

export const CLIENT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_library",
    description:
      "Full-text search over Graphy's library: the official Graph docs, graph-node, indexer-agent and indexer-rs docs, the networks registry docs, the Graph Academy (role-based guides, dispatches, symptom index), and subgraph, substreams, Horizon data service and gateway skills. Returns the best-matching sections with doc_ids. Use the literal error text or specific nouns.",
    strict: true,
    input_schema: { type: "object", properties: { query: str }, required: ["query"], additionalProperties: false },
  },
  {
    name: "read_library_doc",
    description: "Read a whole library document by doc_id (from search_library) when a section is not enough.",
    strict: true,
    input_schema: { type: "object", properties: { doc_id: str }, required: ["doc_id"], additionalProperties: false },
  },
  {
    name: "read_github_file",
    description:
      "Read a file from a public repo under graphprotocol, edgeandnode, streamingfast or PaulieB14, with line numbers, at a branch, tag or commit (default HEAD). Use it to settle what the code actually does and cite file:line. Key repos: graphprotocol/graph-node (Rust), graphprotocol/indexer (indexer-agent and CLI, TypeScript), graphprotocol/indexer-rs (indexer-service and tap-agent), graphprotocol/contracts (Horizon contracts under packages/), graphprotocol/graph-tooling (graph-cli, graph-ts), graphprotocol/graph-network-subgraph, edgeandnode/gateway.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        repo: str,
        path: str,
        ref: { type: ["string", "null"] },
        start_line: { type: ["integer", "null"] },
        end_line: { type: ["integer", "null"] },
      },
      required: ["repo", "path", "ref", "start_line", "end_line"],
      additionalProperties: false,
    },
  },
  {
    name: "search_github_code",
    description: "Search one public repo's default branch for a string, such as an error message or config key, to find which file defines or throws it. Then read the file.",
    strict: true,
    input_schema: { type: "object", properties: { repo: str, query: str }, required: ["repo", "query"], additionalProperties: false },
  },
  {
    name: "list_releases",
    description: "The latest releases of a repo with dates and notes. Use before saying what version fixes something or whether a change has shipped.",
    strict: true,
    input_schema: { type: "object", properties: { repo: str }, required: ["repo"], additionalProperties: false },
  },
  {
    name: "chain_registry",
    description:
      "Look up a chain in The Graph's live networks registry by id, alias, CAIP-2 id or name: which services it supports (subgraphs, substreams, firehose), whether it earns indexing rewards (issuanceRewards), deprecation, RPC and explorer details.",
    strict: true,
    input_schema: { type: "object", properties: { chain: str }, required: ["chain"], additionalProperties: false },
  },
  {
    name: "indexer_status",
    description:
      "Query an indexer's public graph-node status endpoint (https://<host>/status) for one to five deployments: synced, health, fatal and non-fatal errors, chain head and latest block. Use when someone names an indexer and a deployment.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { status_url: str, deployments: { type: "array", items: str } },
      required: ["status_url", "deployments"],
      additionalProperties: false,
    },
  },
];

export const TOOL_LABEL: Record<string, string> = {
  search_library: "searching the library",
  read_library_doc: "reading the docs",
  read_github_file: "reading source code",
  search_github_code: "searching source code",
  list_releases: "checking releases",
  chain_registry: "checking the networks registry",
  indexer_status: "asking the indexer",
  web_search: "searching the web",
  web_fetch: "reading a page",
};

const nn = <T>(v: T | null | undefined) => (v === null ? undefined : v);

export async function runTool(name: string, input: Record<string, unknown>): Promise<{ text: string; error: boolean }> {
  try {
    const s = (k: string) => String(input[k] ?? "");
    switch (name) {
      case "search_library":
        return { text: searchLibrary(s("query")), error: false };
      case "read_library_doc":
        return { text: readLibrary(s("doc_id")), error: false };
      case "read_github_file":
        return {
          text: await readGithubFile({
            repo: s("repo"),
            path: s("path"),
            ref: nn(input.ref as string | null),
            start_line: nn(input.start_line as number | null),
            end_line: nn(input.end_line as number | null),
          }),
          error: false,
        };
      case "search_github_code":
        return { text: await searchGithubCode({ repo: s("repo"), query: s("query") }), error: false };
      case "list_releases":
        return { text: await listReleases({ repo: s("repo") }), error: false };
      case "chain_registry":
        return { text: await chainRegistry({ chain: s("chain") }), error: false };
      case "indexer_status":
        return { text: await indexerStatus({ status_url: s("status_url"), deployments: (input.deployments as string[]) ?? [] }), error: false };
      default:
        return { text: `Unknown tool ${name}.`, error: true };
    }
  } catch (e) {
    return { text: `Tool failed: ${(e as Error).message}`, error: true };
  }
}

export const LIBRARY_BUILT = LIB.built;
