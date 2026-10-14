// Concatenates the private knowledge base into a module at build time, so the deployment
// carries it and the repository never has to be public.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../..", import.meta.url).pathname;
const sources = ["kb", "reference"];

function walk(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
    });
}

const files = sources.flatMap((s) => walk(join(root, s)));
const kb = files
  .map((f) => `<note path="${relative(root, f)}">\n${readFileSync(f, "utf8").trim()}\n</note>`)
  .join("\n\n");

writeFileSync(
  new URL("../lib/kb.generated.ts", import.meta.url),
  `export const KB = ${JSON.stringify(kb)};\nexport const KB_FILES = ${files.length};\n`,
);
console.log(`bundled ${files.length} notes, ${kb.length} chars`);
