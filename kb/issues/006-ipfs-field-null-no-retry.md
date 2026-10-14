# #6 IPFS-derived field is null and never fills in: graph-node does not retry ipfs.cat

**Status:** closed (root-cause-found) · **Area:** graph-node · **Owner:** reporter · **Last checked:** 2026-08-13

**Asked as:** "IPFS field is null", "file data source entity null", "ipfs.cat returns null", "IPFS running 30 minutes behind", "metadata entity null for the latest series", "nulls stopped appearing, are the old ones fixed", "slow IPFS indexing Pinata".

## Answer
graph-node resolves `ipfs.cat` / file data sources once, at index time; on failure it writes `null` and does not retry, so the entity stays null for that block range until a redeploy re-runs the handler. If the field later filled in on its own, it was the propagation window for a freshly pinned CID; if it is still null while the CID resolves now, waiting will never fix it. Not seeing nulls on new blocks does not mean old nulls healed. Recommended: take the URI from the subgraph and fetch the JSON client-side from your own gateway; if you must resolve in the subgraph, budget for redeploys.

## How to check
- Fetch the CID directly (e.g. `ipfs.thegraph.com`, Pinata) to confirm the content exists.
- Query the block range covering the suspected outage and confirm IPFS-derived fields resolved for entities created then.

## Facts worth keeping
- Pinata confirmed an outage on 2026-08-10 (raised by Jerry, Edge & Node, reported 2026-08-11); anything indexed around then through Pinata may have permanent nulls.
- In the original report both CIDs resolved at report time (series 38 content 9,547 bytes).
- Answered by petko (The Night's Watch).
