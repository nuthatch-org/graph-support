# #46 REO from 6 October: an active day needs qualifying queries on 5 subgraphs, applied over the whole window

**Status:** open (status/investigating, reference) · **Area:** area/indexer, area/horizon · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "Rewards Eligibility Oracle 5 subgraphs"; "REO active day requirement"; "why did I lose rewards eligibility"; "do subgraphs need 500 GRT signal to count for REO"; "qualifying subgraph definition"; "REO streak dropped after 6 October".

## Answer
From 6 October 2026 the Rewards Eligibility Oracle counts a day as active only if the indexer served at least one qualifying query on each of at least 5 subgraphs (was 1). Unchanged: 5+ active days in a rolling 28-day window; a qualifying query is HTTP 200, under 5,000 ms, within 50,000 blocks of head; eligibility renewed daily, valid 14 days. Correction of the Discord announcement: the oracle's query (rewards-eligibility-oracle#176, `src/models/bigquery_provider.py`) has no 500 GRT signal floor, so any 5 deployments with a qualifying query count; a filter upstream of the BigQuery table cannot be ruled out. Each daily run checks every day in the 28-day window against the criteria active on the run date, so earlier days with fewer than 5 subgraphs stopped counting on 6 October (not grandfathered). Short indexers should allocate to and sync more deployments the gateway will route to them; freshly curated BNB/Polygon subgraphs from #45 are a cheap source.

## How to check
- REO dashboard: https://hub.thegraph.foundation/reo/ (status and streak; not per-day subgraph count).
- Count distinct deployments receiving receipts per day from indexer-service query logs or `tap_horizon_receipts`; under 5 is a problem. Ignore the original step of dropping deployments under 500 GRT.
- Source: graphprotocol/rewards-eligibility-oracle `ELIGIBILITY_CRITERIA.md`, `src/models/bigquery_provider.py`, commit 498d7d4.

## Facts worth keeping
- Announced by BK (Graph Foundation) in #indexers 22 Sep 2026.
- Went live with rewards-eligibility-oracle#176, merged 6 Oct 2026.
- The 500 GRT floor appears only in the Discord announcement, not in ELIGIBILITY_CRITERIA.md or the query.
- Per-day count tracked in nightswatchhq/lodestar#296.

## May have changed
Any further rewards-eligibility-oracle change to criteria, or a signal filter added upstream of the BigQuery table.
