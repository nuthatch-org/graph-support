# #35 "Failed to fetch block hash from number, error: deadline has elapsed": blockHashFromNumber null after 10 s on graph-node 0.43.0+

**Status:** open (root-cause-found, status/handed-off) · **Area:** area/graph-node, area/indexer · **Owner:** owner/upstream · **Last checked:** 2026-10-09

**Asked as:** "WARN Failed to fetch block hash from number, error: deadline has elapsed", "Failed to query graph node for blockHashFromNumber: no data returned", "IE070", "epoch lookups and allocation closes fail on a busy indexer".

## Answer
Since graph-node#6491 (0.43.0) `Chain::block_pointer_from_number` reads the block cache from Postgres before the RPC, via `pool.get_permitted()`, which waits without limit for an indexing connection permit. When indexing writes hold every permit, the resolver's 10 s deadline expires first and returns `null`, never calling RPC. Old blocks (epoch start, POI blocks) take the Postgres path, so those lookups fail while recent ones work. Reproduced locally (0.41.1 fine, 0.45.0 null at 10.04 s, 0.45.0 with the cache check removed fine). The real fix is upstream: remove the cache check, as #6537 did for `is_on_main_chain`. Not the cause of #34 (that is `query_time_ms: 0`).

## How to check
- `GRAPH_LOG_QUERY_TIMING=gql`: `query_time_ms` about 10000 plus the WARN above. 0 ms and no WARN is #34 instead.
- `store_semaphore_wait_ms` will not show it: the wait is recorded only after the permit is granted.
- Repro technique: `pool_size = 2` and `LOCK TABLE public.ethereum_networks IN EXCLUSIVE MODE`, confirm in `pg_stat_activity`.

## Facts worth keeping
- Workarounds: raise `pool_size` on the node serving the status endpoint (mind Postgres `max_connections`; untested under real load). The original write-up said avoid `GRAPH_EXTRA_QUERY_PERMITS` (it returned the hash at 5.11 s only by timing out the pool, which marks the primary pool unavailable for the node), but the 2026-10-09 status comment recommends raising it. The thread contradicts itself here.
- Upstream: graphprotocol/graph-node#6720 (this), #6721 (silent null, #34), both raised 2026-09-12, no response by 2026-10-09.
- Latest graph-node release v0.45.0 (3 August 2026); master head `6838f4e3c` (25 August).

## May have changed
A graph-node release containing a fix for #6720.
