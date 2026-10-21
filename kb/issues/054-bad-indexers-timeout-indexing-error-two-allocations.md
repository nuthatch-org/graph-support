# #54 bad indexers {LunaNova: Timeout, Ellipfra: BadResponse(no attestation: indexing_error)} on a Base subgraph with two allocations

**Status:** open (status/triage, reopened) · **Area:** area/indexer, area/gateway · **Owner:** owner/indexer · **Last checked:** 2026-10-21

**Asked as:** "bad indexers: {0xe13840a2…: Timeout, 0xf92f430d…: BadResponse(no attestation: indexing_error)}"; "BadResponse(no attestation: indexing_error)"; "queries that worked for a year now fail"; "indexer unhealthy but no errors listed"; "Timeout on queries for 100 elements"; "queries forced through an indexer 3.5M blocks behind"; "playground queries fail too"; "is curation signal the same as allocated stake".

## Answer
`bad indexers` means every candidate was rejected, and this subgraph has only two allocations, so either one failing leaves nothing. As of 2026-10-21 both are out: LunaNova has returned zero 200 responses on every one of its ~450 deployments since 15 October about 07:30 UTC (about 1.5M queries a day, all failing in ~90 ms, so it is not query cost), and Ellipfra dropped its copy and is re-indexing from scratch, at 49,461,698 against a head of 52,893,934 at 10:07 UTC, which is the "3.5M behind" the reporter sees. The gateway excludes an indexer more than 30 minutes behind head only while some other candidate is inside that window, so Ellipfra surfaces precisely because LunaNova fails. The playground uses the same gateway and fails the same way. Ellipfra indexed about 4,900 blocks a minute this morning, so it should be back inside the window within a day; LunaNova's fault is on their side (gemma-lunanova on Discord) and only they can see it. Curation signal is not stake: it is GRT a curator deposits on the subgraph (Explorer's Signal button), and it is what attracts allocations; the owner can signal on their own subgraph.

The 9 October state: Ellipfra `unhealthy` with `fatalError: null` and no non-fatal errors listed (graph-node refuses unattestable queries on a deployment with non-fatal errors, hence `indexing_error`; why the list was empty is unknown), LunaNova healthy and at head but timing out, average latency 15 to 19 s per the QoS rows.

## How to check
- Each indexer's `/status` `indexingStatuses` for health, errors, synced, `latestBlock` versus `chainHeadBlock`; two probes a few minutes apart give the catch-up rate.
- QoS rows per indexer per deployment (the `qos` nest, table `qos_indexer_attempt_rows`, five-minute windows): `query_count`, `num_indexer_200_responses`, `avg_indexer_latency_ms`. Group by day for one deployment, then by day for the indexer across all deployments to tell a subgraph fault from an indexer-wide one.
- Open allocations: `subgraph_service__allocation_created` minus `allocation_closed` in the `alloc` nest.
- Gateway routing rule: `edgeandnode/gateway` `src/client_query.rs` (`build_candidates_list`, the `seconds_behind_cutoff = 60 * 30` retain; commit `8377920`, 2026-10-14). `latest` is set for any query without an exact `block: {number}` or `hash` (`src/block_constraints.rs:44`); `number_gte` does not make a range, so it cannot exclude a lagging indexer.

## Facts worth keeping
- Subgraph `378iBSg3LF7U4Gby57EsgACtTjjhD55fm7324H58sMeo` (Arbitrum One), deployment `QmTGKYHa6fJhACcfSxiVw69xw55f45xLofPqoQ78wfL55F`, chain base; version set at Arbitrum block 273761382 (12 Nov 2024).
- LunaNova `0xe13840a2…8774` (thegraph.lunanova.tech), 22,194.66 GRT, opened 29 Sep 2026, indexer-service 1.8.0 on graph-node 0.36.0; Ellipfra `0xf92f430d…a6d4` (graph-l2prod.ellipfra.com), 43 GRT, opened 17 Jul 2026, indexer-service 2.0.1 on graph-node 0.45.0. Still the only two on 2026-10-21.
- Ellipfra's copy has returned no 200s on this deployment since at least June 2026 per QoS; the gateway kept sending it a share regardless.
- LunaNova's escrow is fine (31,483.7 GRT deposited by the 0x6AA2… sender against 5,099.7 collected, last deposit 14 Oct), and the gateway has been TAP v2 only since 2026-04-15 (gateway #1179), so receipts are not the cause. Four other indexers show zero 200s in the same window but were already at zero on 14 Oct and run current versions; separate faults.
- Gateway quirk: an indexer's `latest_block` in `indexing_performance.rs` only ever goes up (feedback and progress both take the max), so a re-index from scratch is invisible until the gateway restarts. Matches Ellipfra reading "0 blocks behind" in QoS on 10 to 15 Oct while 20M behind, then vanishing from 16 Oct.
- Signal 250.1 GRT on 2026-10-12. Upgrade indexer `/status` returned 403; no allocation.
- Reporter Reshy, 9 Oct 2026 and 21 Oct 2026, #subgraph-development; Marc-André (Ellipfra) pinged by Graphtronauts. Related: #57 (LunaNova's Polygon node frozen on 13 Oct).
- Gateway error reference: reference/gateway-errors.md.

## May have changed
Ellipfra finishing its re-index (expected 22 Oct), LunaNova recovering, new allocations, a gateway change to the 30-minute rule.
