# #20 Identical PoI reused across epochs on an actively indexing deployment

**Status:** open (status/investigating, reference) · **Area:** area/indexer, area/horizon · **Owner:** owner/upstream · **Last checked:** 2026-10-09

**Asked as:** "same POI on two allocations", "identical PoI reused", "duplicate POI", "indexer closing allocations with a stale POI", "stalled deployment still earning rewards", "is this indexer cheating", "how to dispute a POI", "0 rewards vs 184,588 rewards same POI".

## Answer
Duplicate PoIs are common and usually legitimate: a subgraph with no new events has an unchanged store, so its PoI is identical at later blocks (#7). The protocol never validates PoIs on-chain; rewards pay on submission and only a dispute assesses correctness. A zero-reward close on the same PoI is just `maxAllocationEpochs` = 28 expiring, not a judgement. The discriminator: if a fully synced reference indexer returns different PoIs at the two epoch blocks, the deployment was active, so one identical PoI cannot be right for both. Per Marc-André (Ellipfra), a deterministic failure can legitimately repeat PoIs, but if other indexers are synced past the failing block it is a local fault (bad RPC or software). The systemic finding: a failed or stalled deployment keeps earning while the agent closes with the last PoI it holds, and nothing on-chain notices. Indexers should check their own.

## How to check
1. Take the allocation's `closedAtEpoch`.
2. Resolve to a block on the indexed chain via the Epoch Block Oracle subgraph (`QmeqJqJTZg3xqYaYhvc35JzyB7RBqEyJeexjTBDykvxNkJ`).
3. Query a fully synced reference indexer's `publicProofsOfIndexing` at both blocks.
4. Different reference PoIs plus identical submitted PoIs = suspect. Reference used only to prove activity, not to assert the expected PoI (graph-node versions compute different PoIs).
Inconclusive when the reference lacks the deployment, pruned below the block, returns no PoI, or the EBO has no entry.

## Facts worth keeping
- Reported case: indexer `0xfeff9093f6b32d0e5cddba743b06a1fedb87c004` (pops.one), deployment `Qmbsc6XQWbiv4DfLVfaNciScqYLyDWUYjWzrFBbzzmRsMB` (Uniswap V4 Base), PoI `0xeae55d58…d760` on allocations `0x25f5ed73…86896` (ep 1299-1327, 0 rewards) and `0xc6b69e91…25dd2` (ep 1327-1351, 184,588.93 GRT).
- EBO: epoch 1327 = Base 48,916,808; epoch 1351 = Base 49,957,358. Ellipfra reference PoIs differ at the two blocks.
- Sweep: pops.one 7 suspect groups of 9 conclusive (largest `0x5e4e0d31…` reused 40x on matic, 682,044.81 GRT); ellipfra 1 suspect (12 allocations, epochs 700-1007, `QmayWHkdCwBojegpArxYkfiE51FeREcHkBYJCqvhUpfVP2`); `0x8bbe…f699` zero duplicates ever.
- Only 2 of 11 indexers ever earned on the Uniswap V4 Base deployment (Tehn: "almost impossible to sync").
- Arbitration (Marc-André): resolves as a draw unless the indexer was notified on the forum; then 7 days to fix before the PoI is slashable. Discord or GitHub do not start that clock.
- 2026-10-09: no dispute or Arbitration Council ruling on this.
- Credit: VladimirSkalp, Tehn, Marc-André (Ellipfra).

## May have changed
A dispute or ruling, or an indexer-agent/graph-node change to stop closing with stale PoIs.
