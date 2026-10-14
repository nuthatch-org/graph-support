# #17 How the gateway picks indexers, and why placement beats every other lever

**Status:** closed (root-cause-found, reference) · **Area:** area/gateway · **Owner:** none · **Last checked:** 2026-09-08

**Asked as:** "how does the gateway route queries", "almost all requests go to one indexer", "why does my indexer get no queries", "indexers with better latency lose out", "can users choose an indexer", "how to get more queries", "query fees low", "does stake affect query routing", "candidate selection".

## Answer
Users cannot pick an indexer. The gateway (`candidate-selection`) picks up to three candidates per query (`SELECTION_LIMIT = 3`), queries them concurrently and pays each a TAP receipt; selection is a deterministic greedy argmax of marginal score over fee, no randomness. A set inherits its worst `seconds_behind` and lowest `slashable_grt`, so a peer about 10 s further behind, or with roughly 100k GRT or less total stake, gets dropped; success rate alone never drops you, it only reorders. Success rate is raised to the 7th power (capped by `*0.99`), so consistency matters more than peak; fee is a straight divisor and the strongest single lever; latency barely matters (400 ms midpoint); stake saturates around 300k GRT. Placement, not count, decides query share: be allocated on the deployments where the fees are, and fix failed allocations (they earn zero). The original "coverage count explains it" (8.4x allocations vs 7.3x queries) was retracted in thread: fee-weighted coverage gap was only 2.25x, leaving ~3.2x unexplained on contested head deployments. Retained history is a further dimension selection does not see (see #18).

## How to check
- Per-deployment QoS: the QoS oracle's `allocationDailyDataPoints` is keyed per indexer per deployment per day per gateway (`query_count`, `proportion_indexer_200_responses`, `avg_indexer_latency_ms`, `avg_indexer_blocks_behind`). Use it, weighted by `query_count`, not indexer-wide averages.
- Source: `edgeandnode/candidate-selection` at rev `c0bc621`, gateway `src/client_query.rs` (v27.6.0).
- Pre-scoring filters in `client_query.rs`: missing required block range, `seconds_behind` over 30 minutes, unsupported version, blocked.
- Count `earliestBlock` alongside allocation count.

## Facts worth keeping
- Score table: success 0.99 -> 0.9321, 0.95 -> 0.6983, 0.90 -> 0.4783; latency 30 ms -> 0.9785, 200 ms -> 0.8349; stake curve `1 - e^(-1.6e-5 * x)`.
- `slashable_grt` is the indexer's total staked tokens, not stake on that deployment.
- Estimator: success `(s+1)/(s+1+f)` with decaying counters; newcomers start at the 0.99 cap, so the estimator does not trap them.
- Worked case: tehn `0x3b9b…3341` (238 allocations) vs ellipfra `0xf92f…a6d4` (2,000); tehn contested on 216 of 238; 140 head deployments tehn was not on carried 56.4% of sampled fee volume.
- Not the same as `subgraph-dips-indexer-selection` (DIPs).
- tehn's pushback corrected the analysis.

## May have changed
E&N run their own gateway build with configurable weights; selection logic and constants can change.
