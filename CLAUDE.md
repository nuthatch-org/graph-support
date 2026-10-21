# graph-support

Private since the 13 October 2026 stand-down. It is now Chief's insider knowledge base: he pastes a question someone asked (Discord, Telegram, forum) and wants the answer, usually as a reply he can send.

## Answering a pasted question

1. `grep -ril` the literal error text and key nouns across `kb/` and `reference/`, then `gh issue list --state all --search` for anything the notes missed. `kb/README.md` is the index.
2. A note is a starting point, not a verdict. Each carries a "Last checked" date and a "May have changed" line; if the answer depends on a release, an owner or a contract parameter, re-check it against source or chain before saying it.
3. Source checkouts live beside this repo: `~/Projects/indexer` (indexer-agent and CLI), graph-node worktrees, `~/Projects/kittiwake`. Cite `file:line` for anything read from source and say which commit.
4. Lead with the answer and the exact command. If it goes out under Chief's name, it goes through `petko-voice`.
5. Our own services (Lodestar, Kittiwake, Foghorn, the stopgap subgraphs) are off. Don't point anyone at them.
6. Hand the reply over in one copyable code block, in this shape: no opener, the answer first, short plain paragraphs, then this line verbatim (the raw Discord IDs make the mentions ping when pasted), then the sign-off:

   ```
   If you found this useful consider pinging <@210266148581670913>  <@751920325968789514>  <@223433382409797632>  <@900064080163901482>  to nudge the foundation to support my work so that I can keep helping people like you.

   💜 Good luck!
   ```

   The model reply is the NEAR one in `kb/topics/near-subgraph-not-indexed.md`'s case (2026-10-21).

## Keeping it

When an answer is new, or corrects a note, write it down in the same session:

- A new failure mode gets a note in `kb/issues/` (if there is an issue) or `kb/topics/`, in the existing template: Asked as, Answer, How to check, Facts worth keeping, May have changed.
- A correction edits the note and bumps "Last checked". Wrong is worse than missing.
- Credit whoever worked it out, by name, as the issue threads do.
- Add the line to `kb/README.md`.

Everything in `kb/` and `reference/` ships inside ask-graphy's prompt, which is public. Nothing goes in that should not be read by a stranger: no keys, no private contact details, nothing said in confidence.

## ask-graphy

`ask-graphy/` is the public Q&A bot over this knowledge base, at https://askgraphy.com (Next.js on Vercel, Claude Sonnet 5.5 on the house key, Upstash for rate limits and a 4.50 USD daily budget under a 150 USD monthly ceiling). Visitors can bring their own Anthropic key to skip the limits and choose Sonnet 5.5 or Opus 5.5.

- `kb/` and `reference/` are in its prompt. Everything else is a searchable library built by `scripts/build-library.mjs` from shallow clones: the Graph docs, graph-node, indexer and indexer-rs docs, the Academy, and the Horizon, gateway, subgraph and substreams skills. Add a source there.
- Its tools (`lib/tools.ts`) read GitHub source, list releases, look up the networks registry, query an indexer's `/status`, and run SQL on seven live Graph nests (allocations, GNS, DIPS, data services, QoS/REO, GRT supply) polled every 15 minutes, through the `graph-data.89.167.109.4.sslip.io` vhost on Helsinki (basic auth, user `graphy`, credentials only in Vercel and `.env.local`).
- `eval/` holds 41 questions with must-have points, eight of them live-data questions anchored to fixed windows with answers from direct SQL. `node eval/run.mjs <label>` against a local `next dev` on 3918 grades every answer; run it before and after any prompt, tool or library change.
- Deploys are prebuilt from `ask-graphy/`: `vercel build --prod && vercel deploy --prebuilt --prod`. The build clones private nuthatch-org repos through `gh`.
