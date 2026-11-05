# Moving the primary to a catalog-only database

**Last checked:** 2026-11-05 (source at 84537ed21; the whole procedure run end to end on graph-node v0.45.0 with three Postgres 17 databases)

**Asked as:** "migrate the catalog data from my primary shard to another db", "primary that only holds the catalog", "move the primary catalog to a smaller db", "rename the primary shard", "change the current primary shard to a different shard". IroqouisPliskin, Discord, 2026-11-05, with about 200 subgraphs on the primary.

## Answer
Do it the other way round: move the subgraphs out, not the catalog. The name `primary` is hardcoded (`store/postgres/src/subgraph_store.rs:70`) and `deployment_schemas.shard`, `chains.shard` and every shard's `shard_primary` foreign server refer to it by name, so renaming the existing primary means hand-editing catalog rows and fdw mappings with no tooling. Instead: add the new database as an ordinary shard, route new deployments to it with a `[[deployment.rule]]`, move each deployment with `graphman copy create <src> <shard> <node>` then `graphman copy activate` and `unassign` on the source (see [#24](../issues/024-graphman-copy-shard-migration.md)), then `graphman chain change-shard` for the block caches, after the copies, and restart graph-node. The old database is then only catalog; stop graph-node, `pg_dump` it to the small host, point `[store.primary]` at it, start. Chief's `shard-drain` tool (private repo, 2026-11-05) does all of it, checksumming each copy against its source before the switch. graph-node re-points the foreign servers from config on startup (`store/postgres/src/pool/mod.rs:920`, `ForeignServer::update`).

## How to check
- `select shard, count(*) from deployment_schemas group by shard` on the primary: nothing should be left on `primary`.
- `select name, shard from chains` for the block caches.
- `select srvname, srvoptions from pg_foreign_server` on each shard after the restart: host should be the new primary.

## Facts worth keeping
- Primary-only: `public.deployment_schemas`, `chains`, `active_copies` (mapped into every shard as `primary_public`), plus `ens_names`, `db_version`, `unused_deployments`, `subgraphs.subgraph`, `subgraph_version`, `subgraph_deployment_assignment`. Per-deployment metadata (`subgraphs.deployment`, `head`, `subgraph_manifest`, `table_stats`, copy and prune state) lives in the deployment's own shard (`store/postgres/src/pool/mod.rs:225-250`).
- A copy keeps the deployment hash, so allocations and POIs are unaffected; it needs the deployment's disk twice while it runs, so batch them.
- The source need not be synced. Gemma (LunaNova) said only fully synced subgraphs can be copied; `node/src/manager/commands/copy.rs:118-160` has no such check, and on the rig a source 15,000 blocks from head copied, caught up and switched. But `--replace` and `--activate` fire only when the copy reaches chain head (`store/postgres/src/writable.rs:439`), so a syncing source's copy chases it until head, and a failed one never fires at all: activate by hand once the copy's head reaches the source's.
- `graphman copy` only runs while the copy is assigned and unpaused: a copy paused at creation sits queued forever. So a paused source's copy indexes past the source until paused again (to chain head on the rig).
- A copy into the shard the deployment already lives in is refused ("can not copy deployment ... onto itself").
- `graphman unused remove` with no `-d` removes every unused deployment in the cluster; `-d <hash>` filters to unused rows, so it never takes a live copy of the same hash.
- A copy of a hash into a shard that hash left in the last ~11 minutes fails to start: "Initializing graft by copying data from sgdA to sgdOLD" then "Deployment details not found ... Record not found", and graph-node never retries it. Each shard's layout cache is keyed by hash alone (`store/postgres/src/relational.rs:1842`), graphman removes deployments out of process so graph-node never evicts the entry, and a failed refresh re-caches the stale entry. It goes only after 2 x `GRAPH_QUERY_STATS_REFRESH_INTERVAL` (300 s) untouched, or on a graph-node restart; `graphman restart` on the copy does not help; pausing it for that window and resuming does, and shard-drain now waits the window out before copying a hash back into a shard. Reproduced and both cures tested on the rig 2026-11-05.
- After `chain change-shard` a running graph-node logs "Ingestor error: store error: Record not found" until restarted. After the restart the new cache fills and indexing carries on.
- The admin RPC's `subgraph_deploy` `node_id` is overridden by `[[deployment.rule]]` indexers.
- Maks pointed at github.com/vincenttaglia/subgraph-migration (76a5b84, 2026-07-13): raw SQL plus `pg_dump | psql` per deployment, pausing it with graphman, built for moving between clusters with separate primaries. Within one primary its `deployment_schemas` insert would hit the `deployment_schemas_deployment_active` unique index (one active row per hash), and its `exec_write_retry` treats a duplicate key as "already exists (skipped)", so the data would stream into a schema nothing points at. Read, not run.
- `chain change-shard` starts an empty cache that refills from the RPC; it is not a data move.

## May have changed
A graph-node release adding a primary move or shard rename command.
