# #15 A halted chain looks like a perfectly healthy subgraph

**Status:** closed (root-cause-found, reference) · **Area:** area/indexer · **Owner:** owner/watch · **Last checked:** 2026-09-08

**Asked as:** "subgraph synced but data stopped updating", "synced: true, health: healthy but no new data", "hasIndexingErrors false but stale", "_meta block not advancing", "chain halted", "is the chain dead", "Moonbeam subgraph frozen", "two RPCs return the same eth_blockNumber", "Explorer shows green but data is old", "chainHeadBlock not moving".

## Answer
When a chain stops producing blocks, every subgraph on it reports synced, no indexing errors, a real `_meta` block, gateway routing and verifying attestations, because every staleness check measures distance to a chain head that is itself frozen. The data is correct for blocks that exist; the subgraph is frozen, not broken. The only signal that survives is the head block's timestamp against wall clock. A variant: a frozen chain client on one indexer (chain alive) makes `latestBlock` and `chainHeadBlock` wrong together and equal, so comparing them cannot detect it; compare `chainHeadBlock` against an independent RPC's `eth_blockNumber`. Two RPC endpoints agreeing on `eth_blockNumber` is what a halted chain looks like, not proof it is alive.

## How to check
- `{ _meta { block { number timestamp } } }`: if `timestamp` is hours behind now on a chain with seconds-long blocks, the chain or its indexing has stopped.
- Fetch the head block's timestamp from an RPC (`eth_getBlockByNumber latest`), not just `eth_blockNumber`.
- For a stalled chain client: indexer `/status` `chainHeadBlock` vs an independent RPC `eth_blockNumber`.

## Facts worth keeping
- Moonbeam last block 16,796,699 at 2026-08-10T11:36:12Z; official RPC hostname no longer resolves (#14).
- Moonriver final block 17,381,654 at 2026-08-10T08:27:48Z, never announced (#14).
- Scroll Sepolia last block 19,039,813 at 2026-07-16T07:05:07Z (#16).
- Upgrade indexer `monad-testnet` client froze 2026-08-13 at block 53,413,147 while reporting `synced: true, health: healthy`; gap reached 7,140,084 blocks by 2026-09-08 (#25).
- pops.one `0xfeff…c004` BSC client stuck at `chainHeadBlock` 115,664,195 with `health: healthy` (#18).
- Lodestar v4.23.0 (2026-08-11) added per-chain liveness: `live`, `stalled` (90 min), `halted` (6 h), `unknown`, plus a "frozen, not broken" banner. Foghorn probes were not fixed.
- Related: #5, #7, #13, #14.

## May have changed
Lodestar/Foghorn tooling changes; new instances were to be added as comments.
