"use client";

import { useState } from "react";

// Copies the answer's raw markdown, so code fences survive a paste into Discord or GitHub.
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <button type="button" className="copy" onClick={copy} aria-label="Copy answer">
      {done ? "Copied" : "Copy"}
    </button>
  );
}
