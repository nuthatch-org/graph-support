import { Fragment, type ReactNode } from "react";

// Enough markdown for support answers: fences, inline code, bold, links, lists, paragraphs.
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("`")) out.push(<code key={m.index}>{t.slice(1, -1)}</code>);
    else if (t.startsWith("**")) out.push(<strong key={m.index}>{t.slice(2, -2)}</strong>);
    else {
      const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      out.push(<a key={m.index} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    last = m.index! + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const parts = text.split(/```[a-z]*\n?/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i}><code>{part.replace(/\n$/, "")}</code></pre>
        ) : (
          <Fragment key={i}>
            {part.split(/\n{2,}/).filter((b) => b.trim()).map((block, j) => {
              const lines = block.split("\n");
              if (lines.every((l) => /^\s*([-*]|\d+\.)\s/.test(l))) {
                return <ul key={j}>{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*([-*]|\d+\.)\s/, ""))}</li>)}</ul>;
              }
              const h = block.match(/^#{1,4}\s+(.*)/);
              if (h) return <h3 key={j}>{inline(h[1])}</h3>;
              return <p key={j}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>;
            })}
          </Fragment>
        ),
      )}
    </>
  );
}
