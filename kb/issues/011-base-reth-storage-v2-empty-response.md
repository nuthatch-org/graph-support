# #11 base-reth-node 1.2.0 storage v2: "Contract call reverted, reason: empty response"

**Status:** closed (out of scope, unresolved) · **Area:** indexer, rpc · **Owner:** upstream · **Last checked:** 2026-10-05

**Asked as:** "Contract call reverted, reason: empty response", "eth_call empty response on Base", "base-reth-node storage v2 reverts", "lots of reverted contract calls after migrating Base to storage v2", "base-reth-node 1.2.0 graph-node".

## Answer
Unresolved. Two operators on graph-node 1.42 with `base-reth-node` 1.2.0 storage-v2 archive snapshots (official download, no pruning) saw many `empty response` call reverts; `execution reverted: <reason>` lines are real contract reverts and likely legitimate, `empty response` is an `eth_call` returning nothing. Direct mock RPC probes against a v1.1.1 node showed no difference. Inference, not established: a `try_` call cannot tell a revert from missing archive state, so affected subgraphs could be quietly wrong; and an untested hypothesis that the archive download finished with missing segments (`base/node#1157` shows `archives=599/602 progress=100.0%`). Closed on 2026-10-05 as out of scope with neither test run.

## How to check
- `eth_call` at the block and contract from the log line (e.g. block 49,682,931) against the storage-v2 node and a known-good archive; compare.
- PoI comparison for `QmasYjypV6nTLp4iNH4Vjf7fksRNxAkAskqDdKf2DCsQkV` between a storage-v2 operator and a pre-v2 one.
- Walk the range with `eth_getBalance` on a long-lived address every 100k blocks to find gap edges.

## Facts worth keeping
- Download command: `base-reth-node download --chain base --datadir /data --archive -y --download-concurrency 32`.
- v1.2.0 released 2026-07-22; release notes push storage v2 from mid-August.
- Not reported upstream on `base/node` as of 2026-08-13; #1152 and #1153 closed not planned 2026-08-13.
- JB273 (2026-08-24): still seeing empty responses; archives are unpacked on the fly so cannot be counted; no v1.1.1 endpoint left to compare.
- Reported by JB273 (p-ops2.eth) and Marc-André (Ellipfra).

## May have changed
A newer base-reth-node release or an upstream report could settle it.
