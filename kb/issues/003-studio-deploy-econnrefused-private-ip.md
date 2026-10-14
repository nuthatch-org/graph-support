# #3 Studio deploy fails with ECONNREFUSED to a private 10.x address

**Status:** closed (fixed) · **Area:** studio · **Owner:** edge-and-node · **Last checked:** 2026-08-11

**Asked as:** "Failed to deploy to Graph node https://api.studio.thegraph.com/deploy/: Could not deploy subgraph on graph-node: connect ECONNREFUSED 10.0.14.157:8030", "ECONNREFUSED 10.x.x.x:8030", "graph deploy fails, Studio super slow".

## Answer
`10.0.14.157` is an RFC 1918 private address and 8030 is graph-node's index-node status port: Studio's public deploy endpoint accepted the request, then failed to reach its own internal graph-node. Nothing on the user's side (manifest, network, CLI version, deploy key) is involved. Edge & Node repaired the backing service and the deploy succeeded on retry about forty minutes after the report. Any 10.x, 172.16-31.x or 192.168.x address in a hosted service's error is that service failing internally: report, retry in a few minutes, escalate to the service owner if it persists.

## Facts worth keeping
- Deployment in the report: `QmcLh53r4ThbKLTAyPPXxbLGPtEYgjJyC74ryMbRpR8dor`.
- Escalated and resolved by Jerry (Edge & Node). Escalation map: `reference/escalation.md`.

## May have changed
Studio ownership has since moved from Edge & Node to the Foundation; escalate to whoever runs Studio now.
