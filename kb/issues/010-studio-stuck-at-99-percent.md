# #10 Subgraph stuck at 99% synced and not advancing

**Status:** closed (root-cause-found, client-side half only) · **Area:** studio · **Owner:** edge-and-node · **Last checked:** 2026-08-11

**Asked as:** "subgraph stuck at 99%", "stuck at 99% synced", "sync not finishing", "Studio subgraph not syncing", "upgrade indexer stuck".

## Answer
"99%" is not a real quantity: progress is shown against an estimate, and a deployment at 99% has stopped advancing; do not wait out the last 1%. Check `_meta` block against chain head twice a few minutes apart; if it does not move, it is stalled. On Studio or the upgrade indexer only the operator (then Edge & Node SREs) could restart it, and each reported case was at chain head hours after escalation. The server-side root cause was never stated publicly; the thread lists possibilities (stuck block stream, bad RPC provider, deadlocked index node) without establishing any. If on your own graph-node, check block stream and RPC provider; mention recurrence when escalating.

## How to check
- `{ _meta { block { number timestamp } hasIndexingErrors } }`, compared with chain head over two checks.

## Facts worth keeping
- Affected deployments: `Qmb1mXXJcQ71e7TxanYKr8cmwZdFjqmMaekjaMnxwLYXSZ`, `QmSJHvSkvbgNrqvWVX7R3hbgozFmrbLS7YoCgtKN3ZQJjB`, `QmWWuWT7YC2EmjcogB1MarQRBcaR7VWfAPNVYvJJNvNsvG`.
- Escalated and resolved each time by Yash and Jerry (Edge & Node).

## May have changed
Studio and upgrade indexer ownership moved to the Foundation; escalation path differs now (see `reference/escalation.md`).
