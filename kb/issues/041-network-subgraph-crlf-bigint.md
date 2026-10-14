# #41 "string is not a BigInt: `26956207 `": one CRLF manifest failed every network and analytics subgraph version

**Status:** open (root-cause-found, status/handed-off) · **Area:** area/gateway, area/graph-node, area/indexer · **Owner:** owner/foundation · **Last checked:** 2026-10-12

**Asked as:** "string is not a BigInt: `26956207 `: invalid digit found in string in handler `handleSubgraphDeploymentManifest` at block #505750187", "network subgraph failed", "synced: true, health: failed", "gateway down 16 September", "indexer-agent not allocating", "Failed to query remote subgraph deployment ... HTTP request failed", "There was an error while updating watcher, error: HTTP request failed".

## Answer
At Arbitrum block 505750187 (2026-09-16 12:00:37 UTC) someone published deployment `QmTfvmWsmH8WQQYFrGxq4c8JGpFewhvjK8R2DWrxApPYB7` whose manifest has CRLF line endings. The network subgraph's IPFS handler split manifests on `\n`, leaving `\r` on the start block, and `BigInt.fromString("26956207\r")` is a deterministic host error; the "space" in the message is the carriage return. Because the handler is an offchain (file) data source, graph-node re-raises it as non-deterministic and retries forever, so status reads `synced: true, health: failed` and the error block differs per node. Every version (1.0.0 to 2.3.1) and the analytics subgraph failed, taking down the gateway (~3 h), Explorer, indexer-agent and indexer-service. Fixed by Juan (Graph Foundation) with a YAML parser; the fresh build is now the current version.

## How to check
- `grep -c $'\r$' <manifest>` to confirm CRLF.
- If the network subgraph failed, check it before anything on your own side: everything downstream fails at once.
- Confirm the agent is on a current deployment via the `Network subgraph query returned allocations for indexer ... block_number=` log line.

## Facts worth keeping
- Current fixed deployments (v2.3.2, published 2026-09-23): network `QmatH4cd25ymsfCFpgKPRQQ7uCYNgarxanVQ9WCfg4Y7TZ`, analytics `QmVcDkuWfudRb9ZFGpyhiwQ1vmmTR3Vf7CLzKn368jpVF2`. Set `[subgraphs.network] deployment_id` to `QmatH4...`.
- Hotfix grafts on 2.3.1 at block 505750185: network `QmR8WQECdNR6TSUf4FfLSFW7D5RDGGkd7F4A6me56pLqJb`, analytics `QmVZJUULM8GEK5FX5yiGKKpHgHHrq2jMML6AQCTrmkn4sG`. Graft base is fixed to 2.3.1 (`Qme4y...`), so 2.2.7 or older cannot use it.
- Fresh sync starts at Arbitrum block 42439999; quoted from one day (Ellipfra) to about a week.
- Older-version routes: cherry-pick `bbc3125` onto your version and graft at 505750185 (nate, confirmed by Juan), or delete the IPFS handlers and graft (Juan; untested here).
- Unstick the agent meanwhile: change the network subgraph deployment in agent config (stake-machine.eth) or `graphman deploy` (Marc-André); or point the agent's network subgraph URL at a Studio query endpoint (100k free queries).
- Fix: graph-network-subgraph#335 (`yaml.try_fromBytes`, graph-ts 0.38.2, needs graph-node >= 0.37.0), merged 2026-10-11 (`b211a9d`). Buggy code dated from June 2023 (`f2873d5`).
- Still open: public network subgraph endpoint for agents; announcement rights and rollout procedure; slow sync times.
- Credit: Marc-André (Ellipfra), Juan and BK (Graph Foundation), Maks, stake-machine.eth, nate, Gemma (LunaNova), Tehn, mindstyle (pops.one).

## May have changed
A new GitHub release of graph-network-subgraph from master; any public network subgraph endpoint returning.
