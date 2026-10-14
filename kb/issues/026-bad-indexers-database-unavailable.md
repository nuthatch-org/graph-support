# #26 bad indexers: "Store error: database unavailable" from the sole indexer

**Status:** closed (root-cause-found, fixed) · **Area:** area/gateway, area/graph-node, area/indexer · **Owner:** owner/indexer · **Last checked:** 2026-09-08

**Asked as:** `bad indexers: {0x8cc22436ba6f07a4d5dd2043e3109267eee5aab8: BadResponse(unattestable response: Store error: database unavailable)}`, "BadResponse(unattestable response", "Store error: database unavailable", "only one indexer serving my subgraph", "production subgraph down", "how to contact an indexer", "will signal fix it".

## Answer
`Store error: database unavailable` is graph-node's message when its connection pool cannot hand out a connection; the gateway quotes it. Here the operator's store was down for all 189 of its allocations, not the subgraph, and because it was the only allocated indexer the gateway had no other candidate, so a 66% success rate became a hard `bad indexers` error. When a `bad indexers` map has one entry, ask who else has the data: enumerate every indexer that ever allocated to the deployment and check `/status` for a `paused: true`, synced copy, which is a recruitable indexer. Adding signal buys redundancy, not an outage fix; do not redeploy. It recovered within days, and the deployment went from one allocation to five.

## How to check
- Enumerate past allocations from the network subgraph, then `POST /status` unauthenticated to each operator, reading `synced`, `health`, `paused`, `latestBlock`.
- Store down vs deployment wedged: ask the same `/status` about a deployment they do not index. A healthy node returns an empty array in milliseconds; a hung store hangs regardless.
- `indexer-service` `GET /`, `/version` and an invalid-field `POST /status` answer without touching graph-node, so they prove only the front half is up.
- QoS oracle `allocationDailyDataPoints` / `indexerDailyDataPoints` dates the failure.

## Facts worth keeping
- Opolis Mainnet, subgraph `HzCeu1LekAwdE5LBoDscohZ2izUYqj89FeDDZnRk2Mn`, deployment `QmX6GEzUQ2vFBULhFzWByUweNTLATWdzBCoE8b1ALZfo3T`, Ethereum mainnet, startBlock 14,310,598.
- `0x8cc2…5aab8` reverse-resolves to `ubiquitous.ink` (no reachable contact); indexer-service 2.2.1.
- lunanova `0xe13840a2e92e0cb17a246609b432d0fa2e418774` held a paused, synced copy.
- A `null` `defaultDisplayName` in the network subgraph proves nothing about anonymity.
- Nobody served the deployment 2026-08-24 to 08-25 (no QoS rows).
- Reported by Carlos Londoño; signalling guidance from Yash (Edge & Node) and Graphtronauts.

## May have changed
Recovery was verified from the indexer side only, not through the gateway; the operator never explained the fix.
