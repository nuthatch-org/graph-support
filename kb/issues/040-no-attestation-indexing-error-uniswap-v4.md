# #40 "BadResponse(no attestation: indexing_error)" and "Unavailable(too far behind)" on uniswap-v4-ethereum; subgraphError: allow cannot pass the gateway

**Status:** open (root-cause-found, status/investigating) · **Area:** area/gateway, area/graph-node · **Owner:** owner/upstream (Uniswap/v4-subgraph) · **Last checked:** 2026-10-08

**Asked as:** `bad indexers: {...: Unavailable(too far behind), ...: BadResponse(no attestation: indexing_error)}`, "Mapping aborted at src/mappings/swap.ts, line 39, column 16, with message: unexpected null", "does subgraphError: allow work through the gateway", "uniswap v4 subgraph down".

## Answer
The #32 null-pool abort again on a new pool at block 25981858. With `features: [nonFatalErrors]` the deployment keeps indexing but records the error, and graph-node refuses any query at or past `first_error_block` with `indexing_error`; that response is not attestable, so the gateway reports `no attestation: indexing_error` from every indexer past the error. `too far behind` entries are indexers the gateway skipped because others were within 30 minutes of head. `subgraphError: allow` does not help through the gateway (data returned with `graph-attestable: false`, indexer-service does not sign, gateway rejects). Workarounds: pin the query to a block before 25931644 (tested on local graph-node 0.45.0: attestable), or use the community republish `Qmda2K4NcKWXB2AqyGUZEU35DgxSqFFRhkCmrJ8oC9po7i`. The fix already exists upstream (Uniswap/v4-subgraph PR #42, null guard at swap.ts:39); Uniswap never republished.

## How to check
- Each indexer's `/status`: `failed` on one address is that operator's problem; `unhealthy` with the same non-fatal error everywhere is the mapping.
- `cast call <currency> "decimals()(uint8)"` reverting on a pool currency.
- Pinned query: `block: { number: 25931643 }` (needs an indexer whose history covers it).

## Facts worth keeping
- Deployment `QmZsgJLiLQKpb8hxTmQ5LWyrFVvfWzVaL4WK8dfFBn7EeK`, version v0.0.1 (6 Feb 2025). Errors at 25931644 (#32), 25981858 (tx `0x28ee77c3...31ab`, pool `0xc1a7b2b8...e5ee`, bad currency `0xfcd7f0d7...0c23`), 26132192 (tx `0xa8c38451...b8df`).
- `nonFatalErrors` in `/status` lists only the latest block's errors; `first_error_block` stays at the earliest.
- Reproduced with matchstick: deployed commit `ac25872` aborts byte for byte; `ac25872` + PR #42 passes.
- Republish: subgraph `EzLH76FWsZUSBTfp2P6CV7cqN56e1rSt2uWtqtsUMEeb`, published 20 Aug by `0xabdcd4b8...` (not Uniswap), schema only adds fields (pointed at by Marc-André, Ellipfra).
- Gateway source `edgeandnode/gateway` `src/client_query.rs` (too-far-behind filter), `src/indexer_client.rs` (no attestation).
- Corrects `reference/gateway-errors.md` and the Academy `bad-indexers` entry: `no attestation: indexing_error` is not always that operator's failed copy.
- A tehn copy reading `healthy` proves nothing: it prunes to ~10,000 blocks and no longer holds the error blocks.
- Reporter Juan XL.

## May have changed
Uniswap republishing, or Explorer's current version moving off v0.0.1.
