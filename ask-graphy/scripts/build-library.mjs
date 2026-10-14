// Builds Graphy's searchable library from shallow clones of the sources below, split into
// heading-sized sections. Private repos clone through the gh CLI, so the build machine needs access.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const cache = new URL("../.library-cache/", import.meta.url).pathname;
mkdirSync(cache, { recursive: true });

// [repo, private, files to take (path prefixes), label]
const SOURCES = [
  ["graphprotocol/docs", false, ["website/src/pages/en/"], "The Graph docs"],
  ["graphprotocol/graph-node", false, ["docs/"], "graph-node docs"],
  ["graphprotocol/indexer", false, ["docs/"], "indexer-agent docs"],
  ["graphprotocol/indexer-rs", false, ["README.md", "docs/", "crates/config/maximal-config-example.toml", "crates/config/default_values.toml"], "indexer-rs"],
  ["graphprotocol/graph-tooling", false, ["packages/cli/README.md", "packages/ts/README.md"], "graph-cli"],
  ["graphprotocol/networks-registry", false, ["README.md", "docs/"], "networks registry"],
  ["nuthatch-org/graph-academy-v2", true, ["src/content/entries/", "src/content/dispatches/", "src/lib/diagnostics.ts"], "Graph Academy"],
  ["nuthatch-org/horizon-skills", true, ["skills/"], "Horizon data service skill"],
  ["nuthatch-org/gib-skill", true, ["skills/"], "gateway (gib) skill"],
  ["PaulieB14/subgraphs-skills", false, ["skills/"], "subgraph skills (PaulieB14)"],
  ["PaulieB14/substreams-skills", false, ["skills/"], "substreams skills (PaulieB14)"],
  ["PaulieB14/subgraph-mcp-skills", false, ["skills/", "README.md"], "Subgraph MCP skills (PaulieB14)"],
  ["PaulieB14/graph-start", false, ["README.md", "docs/"], "where to start (PaulieB14)"],
];

const TEXT = /\.(md|mdx|toml|ts)$/;

function clone(repo, priv) {
  const dir = join(cache, repo.replace("/", "__"));
  if (existsSync(dir)) {
    execFileSync("git", ["-C", dir, "pull", "-q", "--depth", "1"], { stdio: "ignore" });
  } else if (priv) {
    execFileSync("gh", ["repo", "clone", repo, dir, "--", "-q", "--depth", "1"], { stdio: "ignore" });
  } else {
    execFileSync("git", ["clone", "-q", "--depth", "1", `https://github.com/${repo}`, dir], { stdio: "ignore" });
  }
  const sha = execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"]).toString().trim();
  return { dir, sha };
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  if (statSync(dir).isFile()) return [dir];
  return readdirSync(dir).flatMap((n) => (n.startsWith(".") || n === "node_modules" ? [] : walk(join(dir, n))));
}

// MDX imports, JSX tags and frontmatter fences are noise for search; the prose and code stay.
function clean(text) {
  return text
    .replace(/^import .*$/gm, "")
    .replace(/^export .*$/gm, "")
    .replace(/<\/?[A-Z][^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function title(text, path) {
  return text.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? text.match(/^#\s+(.+)$/m)?.[1] ?? path.split("/").pop();
}

// Sections of roughly 600-4000 characters, split on headings so a hit lands on the relevant part.
function sections(text) {
  const parts = text.split(/\n(?=#{1,3} )/);
  const out = [];
  let buf = "";
  for (const p of parts) {
    if (buf && buf.length + p.length > 4000) {
      out.push(buf);
      buf = "";
    }
    buf += (buf ? "\n" : "") + p;
    if (buf.length > 600) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  return out.flatMap((s) => (s.length > 6000 ? s.match(/[\s\S]{1,4000}(\n|$)/g) ?? [s] : [s]));
}

const docs = [];
const chunks = [];
for (const [repo, priv, prefixes, label] of SOURCES) {
  const { dir, sha } = clone(repo, priv);
  const files = prefixes.flatMap((p) => walk(join(dir, p))).filter((f) => TEXT.test(f));
  for (const f of files) {
    const path = relative(dir, f);
    const text = clean(readFileSync(f, "utf8"));
    if (text.length < 200) continue;
    const id = `${repo}:${path}`;
    const url = priv ? null : `https://github.com/${repo}/blob/${sha}/${path}`;
    docs.push({ id, source: label, title: title(text, path), url, sha, text });
    for (const s of sections(text)) chunks.push({ doc: docs.length - 1, text: s });
  }
  console.log(`${label}: ${files.length} files @ ${sha}`);
}

writeFileSync(
  new URL("../lib/library.generated.json", import.meta.url),
  JSON.stringify({ built: new Date().toISOString(), docs, chunks }),
);
const size = docs.reduce((s, d) => s + d.text.length, 0);
console.log(`library: ${docs.length} docs, ${chunks.length} sections, ${(size / 1e6).toFixed(1)} MB`);
