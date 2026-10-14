# #31 Gateway "BadResponse(400)" from a healthy sole indexer that has denylisted the gateway sender

**Status:** closed (root-cause-found, fixed) · **Area:** area/gateway, area/indexer, area/horizon · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** `bad indexers: {0x3b9ba748691f135b71582dc3292e5e3ed7e13341: BadResponse(400)}`, "can you ping the indexer in the error", "indexer is synced and healthy but queries fail with 400", "subgraph down, only one indexer".

## Answer
indexer-service returns 400 only for a receipt check failure or an EIP-712 error (`crates/service/src/error.rs:85-97`), so a `BadResponse(400)` from a healthy, synced indexer means the payment was refused, not the query. Here (inference, the operator's denylist table was not seen) the indexer's tap-agent had denylisted the mainnet gateway sender during the TAP aggregator outage in #30, and it held the only open allocation, so the gateway had nowhere else to route. Nothing for the indexer or the consumer to do: the denial lifts after the first successful RAV. Closed after #30 was fixed and the deployment gained a second allocation.

## How to check
- Indexer's public `/status`: `indexingStatuses(subgraphs: ["<Qm>"]) { synced health fatalError { message } chains { latestBlock { number } earliestBlock { number } chainHeadBlock { number } } }`. Healthy and synced plus a 400 points at payment.
- Count open allocations on the deployment (Lodestar SQL, `subgraph_service__allocation_created` minus `allocation_closed`). One entry in the map = one candidate.
- Operator side: `SELECT * FROM tap_horizon_denylist;`
- Status code map in indexer-service: 400 = receipt `CheckFailure` or EIP-712; 402 = escrow account / receipt not found; 500 = other TAP error or deployment not found; 502 = axum/serialization.

## Facts worth keeping
- Subgraph `JCYjvfTErSkkFYjGedMHPnTcySpeB1Z81FLYUuEjWXK3`, deployment `QmWP5gEwn5c1utvKSLxiRQLNpXEN1u4W2Nj8LTvzZT8eKZ` (gnosis); indexer `0x3b9ba748...` is Tehn's (`index.tehn.in`).
- That indexer pruned to ~10,474 blocks (~14 h on Gnosis), so historical queries would fail differently even after recovery.
- By 2026-10-08 Ellipfra (`0xf92f430d...a6d4`) allocated at Arbitrum block 512549884 with history back to 27911511. Gateway query not tested.
- Credit: atatakai (report), Tehn (#30 report).

## May have changed
A 400 after 24 September is more likely the sender rotation in #44.
