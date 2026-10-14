"use client";

import { useState } from "react";

export const MODELS = [
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "fast, a few cents a question" },
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "deeper, roughly twice the cost" },
];

export function KeyPanel({
  ownKey,
  onSave,
  reason,
  model,
  onModel,
}: {
  ownKey: string;
  onSave: (k: string) => void;
  reason?: string;
  model: string;
  onModel: (m: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function check() {
    const k = draft.trim();
    if (!k) return;
    setChecking(true);
    setNote(null);
    try {
      const r = await fetch("/api/key", { method: "POST", headers: { "x-anthropic-key": k } });
      const j = await r.json();
      setNote({ ok: j.ok, text: j.message });
      if (j.ok) {
        onSave(k);
        setDraft("");
      }
    } catch {
      setNote({ ok: false, text: "Couldn't check the key. Try again." });
    } finally {
      setChecking(false);
    }
  }

  if (ownKey) {
    return (
      <div className="byo on">
        <span>
          Using your key <code>…{ownKey.slice(-4)}</code>. No limits from Graphy; your Anthropic account pays.
        </span>
        <select value={model} onChange={(e) => onModel(e.target.value)} aria-label="Model">
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}: {m.note}</option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={() => { onSave(""); setNote(null); }}>Forget key</button>
      </div>
    );
  }

  return (
    <div className="byo">
      {reason && <p className="why">{reason}</p>}
      <p className="lead">
        <strong>Bring your own key</strong> to skip the limits. Get one at{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>,
        paste it here, and you pay Anthropic directly: a few cents a question on Claude Sonnet 5.5, or pick Opus 5.5 for harder ones. Graphy also thinks harder on your key.
      </p>
      <div className="row">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
        />
        <button type="button" onClick={check} disabled={checking || !draft.trim()}>
          {checking ? "Checking…" : "Use my key"}
        </button>
      </div>
      {note && <p className={note.ok ? "ok" : "bad"}>{note.text}</p>}
      <p className="fine">
        The key stays in this browser tab and is sent only with your questions. Graphy never logs or stores it. A key
        with a low spend limit is a good idea.
      </p>
    </div>
  );
}
