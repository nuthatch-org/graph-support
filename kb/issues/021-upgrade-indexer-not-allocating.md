# #21 Upgrade indexer not allocating to new subgraphs

**Status:** closed (root-cause-found, fixed) · **Area:** area/studio, area/indexer · **Owner:** owner/edge-and-node · **Last checked:** 2026-09-08

**Asked as:** "Store error: shard not found: shard_d_redux (this usually indicates a misconfiguration)", "Exited early while reconciling deployments. Skipped reconciling actions.", "IE005", "is upgradeindexer.eth still alive", "no default indexer after publishing", "SUBGRAPH NOT INDEXED", "no indexers after 5 hours", "upgrade indexer did not pick up my subgraph".

## Answer
The thread's write-up blamed a `shard_d_redux` store error breaking the unfiltered status query and so stopping `reconcileDeployments` before `reconcileActions` (inference). Yash (Edge & Node) then gave the actual cause: the shard error was a cache issue unrelated to allocations; the upgrade indexer's API key had run out of funds to allocate, and after GRT was added allocations went through and he manually allocated the reported subgraphs. By 2026-09-08 the upgrade indexer was allocating normally. If your deployment is synced and healthy on the upgrade indexer but Explorer shows no indexers, the problem is allocation, not your subgraph: do not republish or add signal; ask the upgrade indexer's operator, or ask in `#indexers` for someone to index it.

## How to check
```console
curl -s -X POST https://indexer.upgrade.thegraph.com/status \
  -H 'content-type: application/json' \
  -d '{"query":"{ indexingStatuses(subgraphs:[\"<Qm-HASH>\"]) { synced health node fatalError { message } } }"}'
```
- No row: never deployed to them.
- Row with `health: failed`/`unhealthy`: deployed and broke (see #19).
- Row `synced: true, health: healthy`, no indexers in Explorer: allocation-side problem (this issue).
Agent code path cited: `indexer-common/src/graph-node.ts:363`, `indexer-agent/src/agent.ts:849` and `:585-598`.

## Facts worth keeping
- Reported by ichichain 2026-08-16: `doudochain_arb_v2`, subgraph `2FnR5Sf9XpG7AX4kEnwsjkHgsyaWTA7F32CWEwJ68nEe`, deployment `QmZ61NKmJRA5s95oEL1SRiUvTLVKYoX68FawY9jyUGNLDL`, arbitrum-sepolia, 83.5 GRT signal.
- `arbitrum-sepolia` has `"issuanceRewards": true` in the networks registry, so testnet is not the reason.
- Upgrade indexer `0xbdfb5ee5…` (upgradeindexer.eth); 19,196 Horizon allocations by 2026-09-08.
- Yash (Edge & Node), 2026-08-17: "The API key ran out of funds to allocate and after adding some GRT, allocations are now going through."

## May have changed
Upgrade indexer now routes to the Foundation, not Edge & Node.
