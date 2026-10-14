// Asks every eval question through a running ask-graphy (default the local dev server), then has
// Sonnet 5.5 grade each answer against its must-have points. Usage: node eval/run.mjs [label]
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE = process.env.GRAPHY_URL ?? "http://localhost:3918";
const label = process.argv[2] ?? "run";
const only = process.env.ONLY?.split(",");
const questions = JSON.parse(readFileSync(new URL("questions.json", here), "utf8")).filter((q) => !only || only.includes(q.id));
const client = new Anthropic();

async function ask(q) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `eval-${q.id}` },
    body: JSON.stringify({ question: q.q }),
  });
  const events = (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  return {
    answer: events.filter((e) => e.t === "text").map((e) => e.v).join(""),
    tools: events.filter((e) => e.t === "status").map((e) => e.v),
    error: events.find((e) => e.t === "error")?.v,
    seconds: (Date.now() - t0) / 1000,
  };
}

const schema = {
  type: "object",
  properties: {
    points: {
      type: "array",
      items: {
        type: "object",
        properties: { pass: { type: "boolean" }, why: { type: "string" } },
        required: ["pass", "why"],
        additionalProperties: false,
      },
    },
    wrong_claims: { type: "array", items: { type: "string" } },
  },
  required: ["points", "wrong_claims"],
  additionalProperties: false,
};

async function grade(q, answer) {
  const r = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    messages: [
      {
        role: "user",
        content: `You grade a support bot's answer about The Graph protocol against a checklist.

Question: ${q.q}

Checklist (one verdict per item, in order). An item passes only if the answer clearly states it or an equivalent:
${q.must.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Also list claims in the answer that contradict the checklist, or that you are certain are false. Do not list a claim merely because you cannot verify it: the bot has sources you do not.

Answer:
"""
${answer}
"""`,
      },
    ],
  });
  const text = r.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text);
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

const results = await pool(questions, 4, async (q) => {
  const a = await ask(q);
  const g = a.error && !a.answer ? { points: q.must.map(() => ({ pass: false, why: a.error })), wrong_claims: [] } : await grade(q, a.answer);
  const passed = g.points.filter((p) => p.pass).length;
  console.log(`${passed}/${q.must.length}  ${q.id}  (${a.seconds.toFixed(0)}s${a.tools.length ? ", " + a.tools.join(", ") : ""})${g.wrong_claims.length ? "  WRONG: " + g.wrong_claims.join(" | ") : ""}`);
  return { id: q.id, ...a, ...g, passed, total: q.must.length };
});

const p = results.reduce((s, r) => s + r.passed, 0);
const t = results.reduce((s, r) => s + r.total, 0);
const wrong = results.reduce((s, r) => s + r.wrong_claims.length, 0);
console.log(`\n${label}: ${p}/${t} points (${((100 * p) / t).toFixed(0)}%), ${wrong} wrong claims`);
mkdirSync(new URL("results/", here), { recursive: true });
writeFileSync(new URL(`results/${new Date().toISOString().replace(/[:.]/g, "-")}-${label}.json`, here), JSON.stringify(results, null, 2));
