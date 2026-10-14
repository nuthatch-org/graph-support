# #50 "SubgraphStartFailure ... database unavailable" on restart: one slow checkout takes a shard offline, failed starts never retry

**Status:** open (status/needs-info, root-cause-found) · **Area:** area/graph-node · **Owner:** owner/reporter · **Last checked:** 2026-09-29

**Asked as:** "Failed to start subgraph, code: SubgraphStartFailure, error: database unavailable"; "Subgraph failed to start, e: LoadManifest { ... source: database query timed out }"; "Connection checkout timed out, wait_ms: 5000, event: unavailable"; "database connection timeout on restart"; "multiple shards, restarts are painful"; "can I disable the block cache shard"; "subgraphs healthy but not indexing after restart".

## Answer
On boot a node starts every assigned deployment at once; each checkout gets `GRAPH_STORE_CONNECTION_TIMEOUT` (5 s). One checkout past that marks the whole shard unavailable for the process, after which checkouts fail immediately with `database unavailable` (one probe every 2 s). A failed start is logged and dropped, never retried; the deployment stays assigned, does not index, and `indexingStatuses` can still report it `healthy` and `synced: true`. Reproduced on v0.45.0 with one shard made slow; the reporter's trigger was WAL/checkpoint load on two shards. Recover with `graphman restart <deployment>` for each failed one. Prevent with `GRAPH_STORE_CONNECTION_TIMEOUT=30000` (the reporter was already on 10000 and still hit it), tune `max_wal_size`/`checkpoint_completion_target`, and restart nodes one at a time. If the database is genuinely down the result is the same and only `graphman restart` recovers.

## How to check
- Find the first `Connection checkout timed out` line for the shard; everything after it is graph-node refusing to try, not Postgres refusing.
- Failed deployments: `grep -E "Failed to start subgraph|Subgraph failed to start"` in the node log, or `deployment_status == 4` in metrics. Not the status API.
- `too many clients already` at setup gives `database setup failed` panic instead (connection exhaustion, different cause).
- `graphman config pools <node ids>` for total connections; `graphman reassign` to the same node is refused with `already assigned`.
- Source: graph-node `core/src/subgraph/registrar.rs:211`, `store/postgres/src/pool/mod.rs:634`, `pool/manager.rs:168`, `core/src/subgraph/instance_manager.rs:131`, `core/src/subgraph_provider.rs:156`.

## Facts worth keeping
- Reproduced on graph-node v0.45.0 (`5973cd9`), 8 shards, 401 deployments, pool_size 10: slow s3 started 1 of 67; with 30000 ms timeout all 67 reached head.
- `GRAPH_STORE_CONNECTION_UNAVAILABLE_RETRY` (2 s probe) and `GRAPH_STORE_SETUP_TIMEOUT` (30 s) arrived in v0.42.0. Call cache can be disabled with `GRAPH_STORE_DISABLE_CALL_CACHE=true` (v0.42.0+); block cache cannot, but can live in any shard including primary.
- Every node pools to every shard in `[store]`; `setup_all` runs under one advisory lock on the primary.
- Reporter IroqouisPliskin (7 shards plus cache shard); mindstyle85 (pops.one) sees it too, usually when the DB really was down.

## May have changed
Waiting on the reporter's 30000 ms test; an upstream fix to retry starts or not mark the shard unavailable on a startup timeout would change the advice.
