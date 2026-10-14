# #43 Receipts refused as "not eligible" because indexer-service reads a frozen network subgraph

**Status:** open (status/needs-info, kind/symptom) · **Area:** area/indexer, area/horizon · **Owner:** owner/reporter · **Last checked:** 2026-10-08

**Asked as:** "Receipt allocation ID `0x…` is not eligible for this indexer"; "IndexerServiceError occurred, error: Issues with provided receipt: Receipt error: Issue encountered while performing check"; "some allocations get paid, new ones refused"; "receipts rejected for an allocation that exists on chain"; "Rejecting stale network subgraph data (not fresher than current best)"; "There was an error while updating watcher".

## Answer
indexer-service accepts a receipt only if the allocation is in a map built by polling the configured network subgraph every `syncing_interval_secs` (60) for Active allocations or ones closed within `recently_closed_allocation_buffer_secs` (3600); nothing checks the chain. The reporter's local network subgraph copy (`QmbYLC…`) failed in the 16 September CRLF outage (#41) at block 505,750,130, so every allocation opened since (49 of 303) was refused while older ones kept working. Only `deployment_id` is health-gated; `query_url` is trusted unconditionally, so pointing `query_url` at your own graph-node trusts a dead copy (inference that this was the reporter's config). Fix: set `[subgraphs.network] query_url` to the gateway, and once the fresh build `QmatH4…` is synced use it as `deployment_id` while leaving `query_url` on the gateway. Restart indexer-service and tap-agent.

## How to check
- indexer-service log (2.0.0+): `Network subgraph query returned allocations for indexer allocations=… block_number=Some(…)`; a block_number stuck far behind Arbitrum head is this.
- On chain: `cast call 0xb2Bb92d0DE618878E438b55D5846cfecD9301105 "getAllocation(address)((address,bytes32,uint256,uint256,uint256,uint256,uint256,uint256,uint256))" $ALLOCATION_ID --rpc-url $ARB`. Yours and open (fifth field 0): network subgraph behind. Yours and closed over an hour ago: refusal is correct. Not yours: gateway sent the wrong receipt.
- `/status` on the node for the network subgraph deployment's health and latest block.
- Source: indexer-rs `crates/service/src/tap/checks/allocation_eligible.rs`, `crates/monitor/src/allocations.rs`, `crates/monitor/src/freshness.rs` (`max_data_staleness_mins` 30), `create_subgraph_client` in `crates/service/src/service.rs`.

## Facts worth keeping
- Reporter Tehn, indexer `0x3B9bA748691F135b71582DC3292E5e3ed7E13341` (tehn-r.eth); allocation `0x434ec2fDc8328314a82DCa12A51A1a74C2DE564d`, created 2026-09-21.
- SubgraphService on Arbitrum One: `0xb2Bb92d0DE618878E438b55D5846cfecD9301105`.
- Frozen copy `QmbYLCwrDHRBCnPJ9hTvHLfRpNXbLbzBKks2uvHUSbeWAd` (pre-2.3.1, cannot take the #41 graft); fresh build `QmatH4cd25ymsfCFpgKPRQQ7uCYNgarxanVQ9WCfg4Y7TZ` (network subgraph 2.3.2), rolled out to the network 2026-09-23 (Juan, #indexers).
- Gateway network subgraph ID used in the fix: `DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp`.
- 2026-10-08: index.tehn.in has `QmatH4…` healthy at head; reporter has not confirmed which one indexer-service reads.
- Upstream cause: #41.

## May have changed
The reporter never confirmed the repoint; any network subgraph upgrade changes which deployment ID to use.
