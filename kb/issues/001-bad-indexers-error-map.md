# #1 What each reason in a "bad indexers" error means

**Status:** closed (root-cause-found, reference) · **Area:** gateway · **Owner:** none · **Last checked:** 2026-08-11

**Asked as:** "bad indexers: {0x...: BadResponse(...)}", "BadResponse(400)", "BadResponse(504)", "Unavailable(too far behind)", "Unavailable(no status: indexer not available)", "Unavailable(missing block: N, latest: M)", "BadResponse(no attestation: indexing_error)", "BadResponse(unattestable response: ...)", "no indexers found", "what does bad indexers mean", "my subgraph query fails with a map of indexer addresses".

## Answer
`bad indexers` means the gateway found indexers allocated to the deployment, tried them, and rejected every one; the map is a per-indexer rejection report. `no indexers found` instead means zero indexers are allocated. `too far behind` = that operator is behind or stalled; `no status: indexer not available` = their indexer-service is down; `missing block` = you pinned a block they lack; `no attestation: indexing_error` = that operator's copy of the subgraph has failed (on every entry: deterministic failure, query changes will not help). A bare `BadResponse(400)` is opaque because the gateway logs the indexer's body on its own side and returns only the status code. `unattestable response` is usually your own query being refused (skip limit, too expensive, depth limit, timeout); if every entry says the same thing, suspect the query or deployment, if they disagree some operators are healthy.

## How to check
- Read every entry, not just the first; compare whether they agree.
- Decoding table: `reference/gateway-errors.md` in this repo.
- Source: `src/errors.rs`, `src/indexer_client.rs` (non-200 body logged then discarded) and `src/unattestable_errors.rs` (suppressed list: `argument must be between 0 and`, `query is too expensive`, `query has a depth that exceeds the limit`, `Query timed out`) in `edgeandnode/gateway` v27.6.0.

## Facts worth keeping
- Read from `edgeandnode/gateway` v27.6.0; those files unmodified in the Night's Watch fork.
- Example error is a real one from The Graph Discord (same map as #4).
