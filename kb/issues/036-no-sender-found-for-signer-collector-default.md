# #36 "No sender found for signer" on indexer-service 2.0.2: graph_tally_collector_address defaults to 0x4444...

**Status:** closed (root-cause-found, fixed) · **Area:** area/indexer, area/horizon, area/docs · **Owner:** owner/reporter · **Last checked:** 2026-10-05

**Asked as:** "There was an error while accessing escrow account: No sender found for signer 0xfF4B7A5EfD00Ff2EC3518D4F250A27e4c29A2211", "IndexerServiceError occurred", "V2 escrow accounts loaded senders=0 signers=0", "after upgrading indexer-service and tap-agent to 2.0.2 receipts rejected".

## Answer
indexer-service and tap-agent 2.0.2 filter escrow accounts by `blockchain.graph_tally_collector_address`, whose default in `default_values.toml` is the placeholder `0x4444444444444444444444444444444444444444`, and the TAP docs never mentioned the key. With the placeholder the network subgraph returns no `paymentsEscrowAccounts`, no payer is loaded, and every receipt from every gateway fails. Fix on 2.0.2: set `graph_tally_collector_address = "0x8f69F5C07477Ac46FBc491B1E6D91E2bb0111A9e"` under `[blockchain]`, or env `INDEXER_BLOCKCHAIN__GRAPH_TALLY_COLLECTOR_ADDRESS`, on both services and restart (confirmed by the reporter). 2.1.0 removed the key and uses `receipts_verifier_address_v2` as the collector.

## How to check
```bash
grep "V2 escrow accounts loaded" <indexer-service or tap-agent log>   # senders=0 with escrow on chain = this issue
```
- On chain (Arbitrum One): `GraphTallyCollector.isAuthorized(payer, signer)`, `getThawEnd(signer)`, `PaymentsEscrow.escrowAccounts(payer, collector, receiver)`.
- Network subgraph `paymentsEscrowAccounts(where: {receiver_: {id: <indexer>}, collector: <addr>, balance_gt: ...})`: `[]` for `0x4444...`, accounts for `0x8f69...`.

## Facts worth keeping
- Signer `0xfF4B7A5E...2211` belongs to E&N sender `0xDDE4cfFd...F467`. GraphTallyCollector `0x8f69F5C07477Ac46FBc491B1E6D91E2bb0111A9e`; PaymentsEscrow `0xf6Fcc27a...673E`.
- Docs typo trap: the TAP page example had `receipts_verifier_address_v2 = "0x8f69...E2be0111A9e"` (`e` for `b`, no contract there; checksums not validated). Breaks receipt verification on any version. Came in with graphprotocol/docs#1059, half-fixed in #1112; fix raised as graphprotocol/docs#1119.
- Do not jump to 2.2.1 to avoid it: graphprotocol/indexer's arbitrum-one network page pins 2.0.2, and tap-agent 2.2.1 has a silent per-sender ingestion freeze (graphprotocol/indexer-rs#1094).
- Same class of silent placeholder default on main for `receipts_verifier_address_v2` (`0x3333...`) and `subgraph_service_address`: graphprotocol/indexer-rs#1099.
- Credit: stake-machine.eth.

## May have changed
Recommended indexer-rs version changing away from 2.0.2; docs#1119 merging.
