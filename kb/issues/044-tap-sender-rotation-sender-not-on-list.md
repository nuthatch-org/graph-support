# #44 Queries drop after the Graph Tally sender rotation: new sender not in sender_aggregator_endpoints

**Status:** closed (root-cause-found) · **Area:** area/indexer, area/horizon, area/docs · **Owner:** owner/foundation · **Last checked:** 2026-10-09

**Asked as:** "Sender 0x6AA2Ace7Ec77C06C1DAb1b0aFaC9d56d9C9D0e50 is not on your [tap.sender_aggregator_endpoints] list"; "There was an error while starting the sender 0x6AA2…, denying it. Error: No sender_aggregator_endpoints found for sender"; "denylisted sender"; "queries dropping after the TAP sender change"; "gateway stopped sending me queries"; "which TAP sender do I configure".

## Answer
The Graph Foundation rotated the mainnet Graph Tally (TAP) sender, live 24 September 2026. Add the new sender `0x6AA2…0e50` to `[tap.sender_aggregator_endpoints]` (shared config read by indexer-service and tap-agent) and keep the old `0xDDE4…F467`; `[tap.trusted_senders]` is optional and not recommended. Restart tap-agent, since the map is read once at startup. If missed, indexer-service keeps serving silently (it never reads that map), but tap-agent denies the sender, writes it to the denylist, and the gateway stops routing for that sender. The tap-agent path is read from source, not observed live; gateway tolerance is inference. After fixing config, delete the denylist row by hand: the agent does not un-deny.

## How to check
- `grep -E "not on your \[tap.sender_aggregator_endpoints\]|No sender_aggregator_endpoints found" <tap-agent log>`
- `select payer, count(*) from tap_horizon_receipts group by 1;` and `select * from tap_horizon_denylist;` - receipts for 0x6AA2… with no RAV, or 0x6AA2… denylisted.
- Clear: `delete from tap_horizon_denylist where sender_address = '6aa2ace7ec77c06c1dab1b0afac9d56d9c9d0e50'` (addresses stored as 40 hex chars, no 0x).
- Source: indexer-rs `crates/tap-agent/src/agent.rs:110`, `crates/tap-agent/src/agent/sender_accounts_manager.rs:463,479`, `crates/monitor/src/escrow_accounts.rs:59`.

## Facts worth keeping
- New sender `0x6AA2Ace7Ec77C06C1DAb1b0aFaC9d56d9C9D0e50`, old `0xDDE4cfFd3D9052A9cb618fC05a1Cd02be1f2F467`, both aggregator `https://tap-aggregator.network.thegraph.com`.
- Announced by tmigone (Graph Foundation) in #indexers 15 Sep, reminded 22 Sep, live 24 Sep 2026; Notion page "Billing changes: indexer update".
- Docs page thegraph.com/docs/en/indexing/tap/ still listed only 0xDDE4… and GraphOps 0xDD6a… (stale).
- Default added in indexer-rs `b845e8f` (PR #1105, 2026-09-17) to `crates/config/default_values.toml`; figment merges operator tables key by key. Not in any release; newest tags `indexer-service-rs-v2.2.1` / `indexer-tap-agent-v2.2.1` (2026-07-17).
- 2026-10-09: new sender has funded escrow (e.g. 226,384 GRT to Ellipfra); old still holds more (~1,038,692 GRT to Ellipfra). No Discord reports of the failure since 24 Sep.
- Related: #30 (denylisted sender), #31, #36.

## May have changed
An indexer-rs release with the new default, or the old sender being retired.
