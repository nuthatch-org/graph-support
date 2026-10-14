# #34 IE070 "Failed to query graph node for blockHashFromNumber: no data returned": status endpoint on a query node

**Status:** closed (root-cause-found) · **Area:** area/graph-node, area/indexer · **Owner:** owner/reporter · **Last checked:** 2026-10-05

**Asked as:** "Failed to query graph node for blockHashFromNumber: no data returned", "Block hash could not be queried", "IE070 Failed to query latest valid epoch and block hash", "all allocations failing after upgrading graph-node 0.41.1 to 0.45.0", "indexer-agent cannot close allocations, every chain".

## Answer
`INDEXER_AGENT_GRAPH_NODE_STATUS_ENDPOINT` pointed at a query node. A graph-node whose `--node-id` fully matches `[general] query` loads no chains (`Networks::noop()`), yet still answers `version` and `indexingStatuses` (which read only the DB), so it looks healthy; every `blockHashFromNumber` returns `null` in 0 ms with nothing logged. graph-node behaves identically on 0.41.1 and 0.45.0. The upgrade exposed it because indexer-agent v0.25.0+ (Horizon) also calls `blockHashFromNumber` in `_resolvePublicPOI` for every non-legacy allocation, Arbitrum One included, so a wrong endpoint now breaks every allocation instead of only non-Arbitrum ones. Fix: point the status endpoint at an index node that has every chain you allocate on (confirmed by the reporter).

## How to check
```bash
curl -s "$INDEXER_AGENT_GRAPH_NODE_STATUS_ENDPOINT" -H 'content-type: application/json' \
  -d '{"query":"{ version { version } blockHashFromNumber(network: \"mainnet\", blockNumber: 25961537) }"}'
grep "Failed to fetch block hash" <graph-node log>
```
- `null`, `query_time_ms: 0` (with `GRAPH_LOG_QUERY_TIMING=gql`), no WARN: the node has no such chain (query node, wrong config, or a proxy splitting traffic).
- `null` after ~10 s with WARN `deadline has elapsed`: #35.
- `null` with WARN and another error: the error is the diagnosis.
- Query node tell: no `Creating transport` / `Starting block ingestor` lines at startup. Check `ss -ltnp | grep 8030`, its `--node-id` and `[general] query`.

## Facts worth keeping
- Reporter stake-machine.eth, same node as #28/#29; agent v0.25.11. Block 25961537 hash `7c8932bb...3f5dde`.
- Resolver `block_ptr_for_number` (`server/index-node/src/resolver.rs`) has a 10 s `BLOCK_HASH_FROM_NUMBER_TIMEOUT`.
- Hyphen/underscore mismatches between `--node-id` and `ingestor` / `[general] query` pass validation silently (graph-node#6718 for the ingestor case).
- Upstream: graphprotocol/graph-node#6721 (log missing network instead of silent null). Separate regression #35 / graph-node#6720.
- Credit: stake-machine.eth (found the mismatch), Marc-André (Ellipfra) (ruled out EBO, pointed at status endpoint), Maks (ingestor theory, ruled out).

## May have changed
graph-node#6721 landing would make the missing-chain case log a warning.
