# #18 Unavailable(TooFarBehind) and one indexer holding all the history

**Status:** closed (root-cause-found) · **Area:** area/gateway, area/indexer · **Owner:** owner/indexer · **Last checked:** 2026-09-08

**Asked as:** "Unavailable(TooFarBehind)", "IndexerErrors({0x…: Unavailable(TooFarBehind)})", "bad indexers", "bad indexer error from time to time", "indexers stuck around 42% synced", "range queries fail intermittently", "sometimes it works, sometimes it fails", "missing block", "BadResponse", "will more GRT/signal help", "how much GRT to get better indexers".

## Answer
`Unavailable(...)` means the gateway excluded that indexer before querying it, so you are not being routed to the lagging ones. A bare `IndexerErrors({...})` without the `bad indexers: ` prefix is a log of candidates dropped during selection, not the error returned to a client (`Error::BadIndexers` is only produced when every candidate failed). The intermittency came from pruning: one healthy at-head indexer retained only ~101k blocks, so queries reaching further back had exactly one candidate, and any blip on it failed them. Allocation count is not coverage, and coverage at head is not coverage at depth. More signal or GRT will not help: it does not sync, un-prune or change gateway selection; the real lever is recruiting an operator who keeps full history. Ask pruning operators to widen their window, and fix mapping bugs (#19).

## How to check
Against each allocated indexer's public `/status`:
```graphql
{ indexingStatuses(subgraphs: ["Qm…"]) {
    synced health
    chains { earliestBlock { number } latestBlock { number } chainHeadBlock { number } }
} }
```
`latest - earliest` is what each indexer can actually answer. Allocations from the network subgraph (`graph-network-arbitrum`). Decoder: `reference/gateway-errors.md`.

## Facts worth keeping
- Deployment `QmQTCx7o6NW9SdJuyQSCYz71YLm3K43dkmtjZ38hbqvwPL` (`squadswap-wow-v2`, subgraph `BgxeY5c3MiwAt4ahqiSq13eKWMGz9ax7dCgwxE7T7Nyn`), indexes BSC though published on Arbitrum (`?chain=arbitrum-one` is the publish chain).
- 2026-08-13: ellipfra full history from 46,190,542; tehn retained 101,254 blocks; pops.one `0xfeff…c004` 64.2M blocks behind with a stalled BSC chain client; upgrade indexer `0xbdfb…e491` unhealthy (1 GRT).
- 2026-09-08 recheck: ellipfra (536 GRT) holds 74.5M blocks of history; `0x3b9ba748…` (165,752 GRT) retains 103,631 blocks. Largest stake = least history.
- Credit: reported by hecrales; log from Jerry (Edge & Node); eding1993 (CRTL).

## May have changed
Allocations and pruning windows on the deployment rotate; the mechanism holds.
