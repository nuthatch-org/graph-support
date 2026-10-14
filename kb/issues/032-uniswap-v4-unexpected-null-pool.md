# #32 uniswap-v4-ethereum unhealthy everywhere: "unexpected null" at swap.ts:39 on a pool whose currency reverts on decimals()

**Status:** open (root-cause-found, status/investigating) · **Area:** area/gateway, area/graph-node · **Owner:** owner/upstream (Uniswap/v4-subgraph) · **Last checked:** 2026-10-12

**Asked as:** "uni v4 mainnet subgraph is down (again)", "Mapping aborted at src/mappings/swap.ts, line 39, column 16, with message: unexpected null", "handleSwapHelper", "all indexers unhealthy", "indexing_error", "subgraphError: allow".

## Answer
The deployment is `unhealthy` (nonFatalErrors), not failed, on every allocated indexer: a deterministic mapping error, so no indexer is at fault and none can fix it. A transaction created a V4 pool whose currency `0x13ccab96...b37a` reverts on `decimals()`, `symbol()` and `name()`, then swapped in it. Confirmed against the deployed commit: `handleInitialize` returns before `pool.save()` when `fetchTokenDecimals` is null (`poolManager.ts:81`, `:107`), and `handleSwap` loads the pool unguarded. Under the default `subgraphError: deny` every query past the error block returns `indexing_error`. Only a republish by Uniswap fixes it; meanwhile use an alternative deployment (see #40 for the community republish and the pinned-block workaround; `subgraphError: allow` does not pass the gateway).

## How to check
- Each indexer's `/status`: same `unhealthy` and same non-fatal error on all of them means the mapping, not the operator.
- `cast call <token> "decimals()(uint8)"` on the pool currencies; a revert with `data: "0x"` is the trigger.
- `Pool(id: "0xa41a37e8...4c24")` absent while `0x7b06d9a5...0152` exists.

## Facts worth keeping
- Subgraph `DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G`, deployment `QmZsgJLiLQKpb8hxTmQ5LWyrFVvfWzVaL4WK8dfFBn7EeK`. First error block 25931644, tx `0x191c60d2...9bff0`. Second abort at the same site at 26132192 (2026-10-08); another at 25981858 in #40.
- PoolManager `0x000000000004444c5dc75cB358380D2e3dE08A90`.
- Alternatives (Graphtronauts): LP Analytics V3+V4 `DGiTDe5qp7LGW7AdiBogapr6ucWAxxyX6AxqjYemTGbB` / `QmekehrDVNH4aQBXcNXjFyEbSgnUc3vGCy2nMF1QDTrzcU`; pool discovery `6XvRX3WHSvzBVTiPdF66XSBVbxWuHqijWANbjJxRDyzr` / `QmTJbtTuJq8dn7RTh3LuYuWj9aqB4fbSbr74xX6JPH5h88` (failed on Ellipfra 2026-10-12 from a full disk, healthy on GraphOps). Community republish `Qmda2K...o7i` (#40).
- Self-hosted option disclosed as ours: the `uniswap-v4-ethereum` nuthatch nest (SQL/HTTP, not GraphQL).
- 2026-10-12: four open allocations (Ellipfra, tehn, LunaNova, data.nexus), all unhealthy; no Uniswap/v4-subgraph commit since 26 July.
- Credit: marco@quasi (report), Graphtronauts (alternatives).

## May have changed
Uniswap republishing a version with the swap.ts null guard (their PR #42) would make this resolved.
