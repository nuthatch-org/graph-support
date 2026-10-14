"use client";

import { useEffect, useRef, useState } from "react";
import { Graphy } from "./Graphy";
import { Markdown } from "./Markdown";
import { KeyPanel, MODELS } from "./KeyPanel";
import { CopyButton } from "./CopyButton";

type Msg = { role: "user" | "graphy"; text: string; error?: boolean };

const STARTERS = [
  "My allocation won't close: IE084",
  "bad indexers: BadResponse(400) on every indexer, what does it mean?",
  "Sender 0x6AA2… is not on your [tap.sender_aggregator_endpoints] list",
  "Subgraph says healthy and synced but the data stopped updating",
];

export default function Page() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [convo, setConvo] = useState<string | null>(null);
  const [turnsLeft, setTurnsLeft] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  const [ownKey, setOwnKey] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [showKey, setShowKey] = useState(false);
  const [keyReason, setKeyReason] = useState<string | undefined>();
  const [quota, setQuota] = useState<{ hourLeft: number; dayLeft: number } | null>(null);
  const end = useRef<HTMLDivElement>(null);

  // Session storage only: the key leaves with the tab, and is sent solely as a request header.
  useEffect(() => {
    try {
      const k = sessionStorage.getItem("graphy-key");
      if (k) setOwnKey(k);
      const m = sessionStorage.getItem("graphy-model");
      if (m && MODELS.some((x) => x.id === m)) setModel(m);
    } catch {}
  }, []);
  function saveModel(m: string) {
    setModel(m);
    try {
      sessionStorage.setItem("graphy-model", m);
    } catch {}
  }
  function saveKey(k: string) {
    setOwnKey(k);
    try {
      if (k) sessionStorage.setItem("graphy-key", k);
      else sessionStorage.removeItem("graphy-key");
    } catch {}
  }

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, status]);

  function reset() {
    setMsgs([]);
    setConvo(null);
    setTurnsLeft(null);
    setClosed(false);
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy || closed) return;
    setInput("");
    setBusy(true);
    setStatus("thinking");
    setMsgs((m) => [...m, { role: "user", text: question }, { role: "graphy", text: "" }]);
    const patch = (f: (last: Msg) => Msg) => setMsgs((m) => [...m.slice(0, -1), f(m[m.length - 1])]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json", ...(ownKey.trim() ? { "x-anthropic-key": ownKey.trim() } : {}) },
        body: JSON.stringify({ question, conversationId: convo, model: ownKey ? model : undefined }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const e = JSON.parse(line);
          if (e.t === "text") {
            setStatus("");
            patch((l) => ({ ...l, text: l.text + e.v }));
          } else if (e.t === "status") {
            setStatus(e.v);
            patch((l) => (l.text && !l.text.endsWith("\n\n") ? { ...l, text: l.text + "\n\n" } : l));
          } else if (e.t === "error") {
            if (e.code === "rate" && !ownKey) {
              // Rate limited: drop the empty bubble and the question goes back in the box.
              setMsgs((m) => m.slice(0, -2));
              setInput(question);
              setKeyReason(e.v);
              setShowKey(true);
            } else {
              patch((l) => ({ ...l, text: (l.text ? l.text + "\n\n" : "") + e.v, error: !l.text }));
              if (e.code === "full") setClosed(true);
              if (e.code === "key") setShowKey(true);
            }
          } else if (e.t === "done") {
            setConvo(e.conversationId);
            setTurnsLeft(e.turnsLeft);
            setClosed(e.closed);
            setQuota(e.quota);
          }
        }
      }
    } catch {
      patch((l) => ({ ...l, text: "Graphy lost the signal. Try again.", error: true }));
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <main>
      <header>
        <Graphy size={msgs.length ? 64 : 140} bob={busy} />
        <div>
          <h1>Ask Graphy</h1>
          <p className="sub">An astronaut hedgehog who has read every support thread so you don't have to. Subgraphs, indexers, the gateway, TAP, rewards.</p>
        </div>
      </header>

      {msgs.length === 0 && (
        <section className="starters">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => ask(s)}>{s}</button>
          ))}
        </section>
      )}

      <section className="log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}${m.error ? " error" : ""}`}>
            {m.role === "graphy" ? <Markdown text={m.text} /> : <p>{m.text}</p>}
            {m.role === "graphy" && m.text && !m.error && !(busy && i === msgs.length - 1) && <CopyButton text={m.text} />}
          </div>
        ))}
        {status && <div className="status">Graphy is {status}…</div>}
        <div ref={end} />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          placeholder={closed ? "This conversation is full. Start a new one." : "Paste the error, the deployment ID (Qm…) and the chain. Never paste keys here."}
          maxLength={2000}
          rows={3}
          disabled={busy || closed}
        />
        <div className="bar">
          <span className="hint">
            {turnsLeft !== null && !closed ? `${turnsLeft} follow-ups left here. ` : ""}
            {!ownKey && quota ? `${quota.hourLeft} questions left this hour, ${quota.dayLeft} today. ` : ""}
            <button type="button" className="link" onClick={() => setShowKey((v) => !v)}>
              {ownKey ? "Using your key" : "Bring your own key"}
            </button>
          </span>
          {msgs.length > 0 && <button type="button" className="ghost" onClick={reset} disabled={busy}>New conversation</button>}
          <button type="submit" disabled={busy || closed || !input.trim()}>Ask</button>
        </div>
        {showKey && <KeyPanel ownKey={ownKey} onSave={(k) => { saveKey(k); if (k) setKeyReason(undefined); }} reason={keyReason} model={model} onModel={saveModel} />}
      </form>

      <footer>Graphy can be wrong. Check anything that moves money against the source. Built on notes from community support threads; not affiliated with The Graph Foundation.</footer>
    </main>
  );
}
