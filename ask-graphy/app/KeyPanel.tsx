"use client";

import { useState } from "react";

export type Model = { id: string; label: string };
export type SavedKey = { key: string; provider: "anthropic" | "openai" | "xai"; models: Model[] };

const NAMES = { anthropic: "Claude", openai: "ChatGPT", xai: "Grok" };

export function KeyPanel({
  saved,
  onSave,
  reason,
  model,
  onModel,
}: {
  saved: SavedKey | null;
  onSave: (k: SavedKey | null) => void;
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
      const r = await fetch("/api/key", { method: "POST", headers: { "x-user-key": k } });
      const j = await r.json();
      setNote({ ok: j.ok, text: j.message });
      if (j.ok) {
        onSave({ key: k, provider: j.provider, models: j.models });
        onModel(j.models[0].id);
        setDraft("");
      }
    } catch {
      setNote({ ok: false, text: "Couldn't check the key. Try again." });
    } finally {
      setChecking(false);
    }
  }

  if (saved) {
    return (
      <div className="byo on">
        <span>
          Using your {NAMES[saved.provider]} key <code>…{saved.key.slice(-4)}</code>. No limits from Graphy; your account pays.
        </span>
        <select value={model} onChange={(e) => onModel(e.target.value)} aria-label="Model">
          {saved.models.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={() => { onSave(null); setNote(null); }}>Forget key</button>
        {note?.ok && <p className="ok">{note.text}</p>}
      </div>
    );
  }

  return (
    <div className="byo">
      {reason && <p className="why">{reason}</p>}
      <p className="lead">
        <strong>Bring your own AI (API key) and skip the rate limits.</strong> Paste a key from{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Claude</a>,{" "}
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">ChatGPT</a> or{" "}
        <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer">Grok</a>, pick a model, and your account pays
        directly, usually a few cents a question. On a Claude key Graphy also thinks harder and can search the web.
      </p>
      <div className="row">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…, sk-… or xai-…"
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
