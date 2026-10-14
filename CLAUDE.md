# graph-support

Private since the 13 October 2026 stand-down. It is now Chief's insider knowledge base: he pastes a question someone asked (Discord, Telegram, forum) and wants the answer, usually as a reply he can send.

## Answering a pasted question

1. `grep -ril` the literal error text and key nouns across `kb/` and `reference/`, then `gh issue list --state all --search` for anything the notes missed. `kb/README.md` is the index.
2. A note is a starting point, not a verdict. Each carries a "Last checked" date and a "May have changed" line; if the answer depends on a release, an owner or a contract parameter, re-check it against source or chain before saying it.
3. Source checkouts live beside this repo: `~/Projects/indexer` (indexer-agent and CLI), graph-node worktrees, `~/Projects/kittiwake`. Cite `file:line` for anything read from source and say which commit.
4. Lead with the answer and the exact command. If it goes out under Chief's name, it goes through `petko-voice`.
5. Our own services (Lodestar, Kittiwake, Foghorn, the stopgap subgraphs) are off. Don't point anyone at them.

## Keeping it

When an answer is new, or corrects a note, write it down in the same session:

- A new failure mode gets a note in `kb/issues/` (if there is an issue) or `kb/topics/`, in the existing template: Asked as, Answer, How to check, Facts worth keeping, May have changed.
- A correction edits the note and bumps "Last checked". Wrong is worse than missing.
- Credit whoever worked it out, by name, as the issue threads do.
- Add the line to `kb/README.md`.

Everything in `kb/` and `reference/` ships inside ask-graphy's prompt, which is public. Nothing goes in that should not be read by a stranger: no keys, no private contact details, nothing said in confidence.

## ask-graphy

`ask-graphy/` is the public Q&A bot over this knowledge base (Next.js on Vercel, Claude Sonnet 5.5 only, Upstash for rate limits and a 4.50 USD daily budget under a 150 USD monthly ceiling; visitors can bring their own Anthropic key to skip the limits). `npm run kb` rebuilds the bundled notes; a deploy picks up any change to `kb/` or `reference/`.
