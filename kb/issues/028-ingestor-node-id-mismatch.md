# #28 Nothing indexes after upgrading graph-node past 0.42.1: [chains] ingestor mismatch

**Status:** closed (root-cause-found) · **Area:** area/graph-node, area/indexer · **Owner:** owner/reporter · **Last checked:** 2026-09-08

**Asked as:** "Not running block ingestion, ingestor is index-node-0", "Not running block ingestion, ingestor is", "upgraded graph-node and it does nothing", "0.41.1 to 0.45.0 nothing indexes", "chain head not moving after upgrade", "all subgraphs stuck at the same block", "Block ingestor disabled by --disable-block-ingestor".

## Answer
From v0.42.1 (graph-node #6447) `[chains] ingestor` is honoured: a node ingests blocks only if `ingestor` exactly equals its `--node-id` and `--disable-block-ingestor` is unset. Before that the value was parsed and ignored. The reporter had `ingestor = "index-node-0"` with `--node-id index_node_0`; both are valid node ids (validation checks length only), so nothing flagged it and no node ingested, freezing the chain head at restart while logs still looked busy as deployments worked through backlog. Fix: set `ingestor` to the exact `--node-id` of a running node and restart. Nothing needs repairing; deployments resume from their own block pointers. It is a single section-level value, not per chain.

## How to check
- `grep -i "block ingest" <logs>`: `Not running block ingestion, ingestor is X` on every node and no node is `X` means this; `Block ingestor disabled by --disable-block-ingestor` is the kill switch; neither line means ingestion is running.
- `graphman --config config.toml chain list` (stored head) vs `cast block-number --rpc-url <provider>`, twice a minute apart.
- Source: `Config::is_block_ingestor` in `node/src/config.rs`, branch in `node/src/launcher.rs`.

## Facts worth keeping
- Other quiet failures on the 0.41 -> 0.45 path: alloy migration may need `no_eip2718` provider feature (0.42.0, #6063/#6317); startup DB migrations can look hung (`GRAPH_STORE_SETUP_TIMEOUT`); Elasticsearch CLI flags/env removed in 0.44.0 (#6278), now `[log_store]`; Substreams removed in 0.42.0 (#6261); `GRAPH_GETH_ETH_CALL_ERRORS` renamed `GRAPH_RPC_ETH_CALL_ERRORS` in 0.45.0 (#6487), old name silently ignored.
- 0.45.0 (#6648): a shard with `pool_size = 0` is skipped with ``Ignoring chain `X`: its shard `Y` has no connection pool (pool_size = 0)`` instead of panicking; relevant when upgrading from 0.44.
- Upstream graphprotocol/graph-node#6718 raises the log to WARN and prints the node's own id.
- Symptom index: graph-academy-v2#7 `everything-stopped-same-block`.
- Same logs showed an unrelated deterministic failure: `QmStfa6zwPUzKHyGrgdNMh8rgbc91sgvmskidBSujG92FR`, `Index out of range in handler handleSwapIn at block #23238770`, tracked separately.
- Reported and fixed by stake-machine.eth.

## May have changed
graph-node#6718 landing would change the log line text and level.
