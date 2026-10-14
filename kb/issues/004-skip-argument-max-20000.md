# #4 Skip argument capped at 20000 by an indexer's GRAPH_GRAPHQL_MAX_SKIP

**Status:** closed (root-cause-found) · **Area:** gateway, indexer · **Owner:** reporter · **Last checked:** 2026-08-11

**Asked as:** "The skip argument must be between 0 and 20000, but is 21000", "BadResponse(unattestable response: The skip argument must be between 0 and", "pagination with skip stopped working after months", "bad indexers on every entity type".

## Answer
An indexer set `GRAPH_GRAPHQL_MAX_SKIP` to 20000; it is a per-operator graph-node env var, and the cap is a legitimate defence on a subgraph over 1TB. Nothing changed on the user's side; deep `skip` was always at the mercy of each operator's config. The gateway wraps this as `BadResponse(unattestable response: ...)` under `bad indexers`, so it looks like broken operators when it is the query being correctly refused. Fix: cursor pagination, `orderBy: id, orderDirection: asc, where: { id_gt: $lastId }`, `""` for the first page, then the last id of each page; it is constant cost per page, unlike `skip`.

## How to check
- The error text names the cap: `must be between 0 and <N>`.
- `argument must be between 0 and` is on the gateway's unattestable list, `src/unattestable_errors.rs`.
- Docs: https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#cursor-based-pagination-example

## Facts worth keeping
- Root cause spotted by Maks; pagination guidance from Jerry (Edge & Node); indexer Suntzu lifted the cap temporarily as a courtesy (no guarantee).
- Same error map as #1.
