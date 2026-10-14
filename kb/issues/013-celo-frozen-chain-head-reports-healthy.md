# #13 Celo subgraphs stuck ~89h while the sole indexer reports healthy against a frozen chain head

**Status:** closed (root-cause-found) · **Area:** indexer, rpc · **Owner:** indexer · **Last checked:** 2026-08-13

**Asked as:** "subgraph 88h behind head", "indexer says synced 99.98% but data is days old", "health: healthy, synced: true but not advancing", "chainHeadBlock not moving", "Celo subgraph stuck", "olas-celo-registry / olas-celo-staking stale".

## Answer
The chain client behind the only allocated indexer froze; graph-node measures sync progress against its own chain client's head, so relative to the frozen head it reported healthy, synced, 99.98% and 13,448 blocks behind, while really 320,282 blocks (89h) behind. A stalled chain client presents as a healthy indexer; comparing `latestBlock` to the indexer's own `chainHeadBlock` cannot detect it, only an independent view of the chain can. With one indexer allocated the gateway had no fallback, so the deployments were dark. Fix is on the operator: restart or resync the chain client; redeploying does nothing. Recovery shows as status flipping from `synced` to `syncing` once the node sees the real tip.

## How to check
- Indexer status endpoint: compare its `chainHeadBlock` against an independent RPC head (e.g. `forno.celo.org` `eth_blockNumber`).
- Lodestar v4.23.0 chain liveness (wall-clock based) flags this; `reconcileToNetworkHead` cannot on a single-indexer deployment.

## Facts worth keeping
- Deployments: `QmQZCy2N1GMF482ZcL8Kzo2PSkDNAA8uBMgZVyM6qHTA3Q` (olas-celo-registry), `QmYRQT2GDsV3C2ERfinFu4pm9s75cfDq2R63eLvMsHtyTp` (olas-celo-staking).
- Indexer `0xf92f430dd8567b0d466358c79594ab58d919a6d4` (Ellipfra, `graph-l2prod.ellipfra.com`); frozen head 74,235,209.
- Resolved 2026-08-13: both at 74,711,957, matching forno to the block; catch-up about 3x realtime on a 1.000 s chain.
- Lodestar release: https://github.com/nightswatchhq/lodestar/releases/tag/v4.23.0 (#15).
- Reported by atepem; fixed by Ellipfra.
