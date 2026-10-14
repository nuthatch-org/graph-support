# #24 Moving subgraph data between shards and decommissioning a shard

**Status:** open (status/handed-off, reference) · **Area:** area/graph-node, area/indexer · **Owner:** owner/watch · **Last checked:** 2026-10-08

**Asked as:** "best practice for moving subgraph data between shards", "graphman copy", "how to move a deployment to another shard", "how to remove a shard", "decommission a shard", "graphman chain change-shard", "could not find a block with number N in our cache", "has not indexed any blocks yet and can not be used as the source of a copy", "graphman drop not found", "graphman docs missing commands".

## Answer
Use `graphman copy create [--offset N] [--activate | --replace] <src> <shard> <node>`; it creates a new deployment in the target shard that the target node indexes forward, and is batched, self-tuning, resumable and replica-lag-aware. It is a copy, not a move: use `--replace` for a move, otherwise `graphman copy activate` once the copy is level with the source, then `graphman unused record` and `graphman unused remove` to reclaim the source. Copy refuses if the source has indexed nothing, is younger than the offset (default 200), the offset block is below a pruned `earliest_block_number`, or the block is missing or ambiguous in the chain cache. There is no shard-removal command: move deployments first, then `graphman chain change-shard` (which creates an empty cache and renames the old one `<chain>-old`, so it is not a migration), then `graphman chain remove <chain>-old`, remove from config, `graphman database remap`, and drop stale `postgres_fdw` foreign servers by hand, since graph-node never drops them. All of this is read from source, not executed; what breaks from stale foreign servers is untested inference.

## How to check
- `graphman copy status <dst>`, `graphman copy list` (copies and grafts in flight).
- `graphman info <src>` for current shard; `deployment_schemas` table for a shard's contents.
- `select srvname from pg_foreign_server` on each remaining shard.
- Source: `node/src/bin/manager.rs`, `node/src/manager/commands/copy.rs`, `store/postgres/src/copy.rs`, `store/postgres/src/deployment.rs`, `node/src/manager/commands/chain.rs`, `store/postgres/src/pool/foreign_server.rs`.

## Facts worth keeping
- Order matters: change the chain cache shard after copying deployments, or copies fail against the refilling cache.
- Copy progress in `subgraphs.copy_state` / `subgraphs.copy_table_state`; logs every three minutes.
- `docs/graphman.md` documents 5 of 24 top-level commands; `copy`, `dump`, `restore` undocumented.
- `graphman drop` was removed (graph-node #5974); use `graphman remove` then `graphman unused record && graphman unused remove`. Docs still show `drop`.
- Docs PR graphprotocol/graph-node#6717, open since 2026-08-26, unreviewed as of 2026-10-08; v0.45.0 latest release then.
- Maks noted more commands missing from the docs.

## May have changed
graph-node#6717 merging, or a new release adding a shard drain command.
