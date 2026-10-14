# #57 Unavailable(too far behind) on Polygon: deployments frozen "healthy" on Ellipfra and LunaNova

**Status:** open (status/triage) · **Area:** area/indexer · **Owner:** owner/indexer · **Last checked:** 2026-10-13

**Asked as:** "bad indexers: … Unavailable(too far behind)"; "subgraph stuck at block 95,335,908"; "indexer healthy but not advancing"; "upgrade indexer no longer serves my subgraph"; "Polygon subgraph stopped syncing, no errors".

## Answer
All three candidates were behind or absent: Ellipfra frozen `healthy` with no errors at 95335908, LunaNova frozen `healthy` at 95375191, and the upgrade indexer returning `[]` despite an active allocation, so the gateway answered `too far behind`. It was not this subgraph: 15 Polygon deployments froze on Ellipfra across five nodes and 22 on LunaNova, all on `indexer_poly_1`, while others on the same indexers stayed at head. Different stall blocks and graph-node versions (0.45.0 vs 0.36.0) rule out one bad block or one regression; the cause is unknown (theory: LunaNova's node lost Polygon ingestion; Ellipfra matches the "healthy but frozen" runner death of #51). Probable fix is indexer-side `graphman restart`; nothing to change in the subgraph. Ellipfra reported "We're back to chain head" on 12 Oct and was at head on 13 Oct; LunaNova and gateway behaviour not rechecked.

## How to check
- Each indexer's `/status` `indexingStatuses`: `latestBlock` versus chain head, re-checked after 90 s to see whether it moves.
- Compare other deployments on the same chain and node to tell a node-wide stall from a subgraph fault.
- Network subgraph for active allocations.

## Facts worth keeping
- Deployment `QmbzwJnre963f9wT9VCJPede69vaniAKWVHzUEsAmBfrHG` (`0xcaf6c4aa…37e3`), subgraph `Gr65KnnNMgEbZaJQg6ZkshAEdRXVKKgVtSMCEfUmJfvM`, `ox-ai-pro-mainnet`, chain matic, ~601 GRT signal.
- Allocations: Ellipfra `0xf92f430d…` (epoch 1388), upgrade indexer `0xbdfb5ee5…` allocation `0x67623bd6…` (epoch 1309), LunaNova `0xe13840a2…` (epoch 1404).
- Also frozen on both: `QmdZcrzf…` (GET Token Polygon), `QmXGTJfx…` (polynetica-prod), `QmUwfc97…` (Boost Indexer Production).
- Ellipfra at 95451027 vs head 95451029 on 13 Oct 2026; cause not stated.
- Reported by itadori, 12 Oct 2026. Related: #51, #35, #45.

## May have changed
LunaNova's copy and the upgrade indexer's empty status are unconfirmed; the Polygon Studio sunset (#45) may explain the latter.
