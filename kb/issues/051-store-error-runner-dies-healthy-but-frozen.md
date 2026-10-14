# #51 "Subgraph instance failed to run: store error" after a Postgres blip: deployment frozen but "healthy"

**Status:** open (status/handed-off, root-cause-found) · **Area:** area/graph-node · **Owner:** owner/upstream · **Last checked:** 2026-10-10

**Asked as:** "Subgraph instance failed to run: store error: error communicating with the server"; "store error: connection closed"; "Subgraph instance failed to run: database query timed out"; "subgraph writer poisoned by previous error"; "Failed to transact block operations: store error: connection closed"; "subgraph stopped indexing but reports healthy"; "deployments randomly stop, graphman restart fixes it"; "wasn't happening on older versions".

## Answer
Two defects in graph-node `core/src/subgraph/runner/mod.rs`. A: after a non-deterministic handler store error the runner calls `store.health()?` before recording the error; with idle pooled connections (not revalidated within `GRAPH_STORE_CONNECTION_VALIDATION_IDLE_SECS`, 30 s) it gets a dead socket, the error is not retried, the runner returns and is never restarted, and the DB still says `healthy` (since at least v0.41.1). B (regression in v0.42.0, commit `73fabf34c`): a poisoned async writer is no longer replaced on retry, so the deployment loops on `subgraph writer poisoned by previous error` and shows `failed`. Recover with `graphman restart <deployment>`. `GRAPH_STORE_CONNECTION_VALIDATION_IDLE_SECS=0` only prevents A for outages under about 3 s; nothing in config prevents B. Fix is graphprotocol/graph-node#6730; an unofficial build v0.45.0-patch.1 carries it.

## How to check
- Logs: `Subgraph instance failed to run` (A); `subgraph writer poisoned by previous error` repeating (B).
- Metrics: A unregisters the deployment's metrics, so look for an assigned deployment whose `deployment_head` stops or whose `deployment_status` series disappears; `health` will not show A. B shows `deployment_status` 4.
- Source: `core/src/subgraph/runner/mod.rs`, `instance_manager.rs:600`, `pool/manager.rs:120`.

## Facts worth keeping
- Reported by Marc-André (Ellipfra): link flapped twice in 6 s, 58 of 210 deployments on a node stopped (Revert Aerodrome Base, Request Network flagged by Jerry); mindstyle (pops.one) sees it on v0.45.0. Matthew Darwin asked about metrics; Maks noted no runner change 0.44.0 to 0.45.0.
- Historical: graph-node #4190 (2022) fixed by #4533 (Apr 2023), undone by the v0.42.0 refactor.
- Reproduced on v0.45.0 (`5973cd995`) with toxiproxy: `reset_peer`, pool 40 stopped 10 of 11 (A, all healthy); patched 0 of 11. 10 s outage with validation env var: 2 of 10 stopped.
- Upstream PR graphprotocol/graph-node#6730 (opened 2026-10-07).
- Unofficial build https://github.com/cargopete/graph-node/releases/tag/v0.45.0-patch.1, image `ghcr.io/cargopete/graph-node:v0.45.0-patch.1` (reports `0.45.0+patch.1`), = v0.45.0 + #6730, #6710, #6729; POIs match v0.45.0 at blocks 1000, 5000, 12345, 20000 for a block-handler test subgraph.

## May have changed
An official graph-node release including #6730.
