# #27 unexpected null in handleProductRemoved after a contract upgrade changed event signatures

**Status:** closed (root-cause-found) · **Area:** area/graph-node · **Owner:** owner/reporter · **Last checked:** 2026-09-08

**Asked as:** "unexpected null in handler `handleProductRemoved` at block #50541186", "Mapping aborted at src/mappings/productsModule.ts, line 286", "unexpected null in handler", "Slice subgraph failed", "subgraph stopped getting new events", "entity missing in removal handler", "contract upgraded and subgraph broke", "data months out of date with no errors".

## Answer
The Slice `ProductsModule` UUPS proxy was upgraded on 2026-06-20 (Base block 47,591,975) and 11 of the 13 events the subgraph handles changed signature, so their topics stopped matching and graph-node silently delivered nothing for them for 68 days. The failure appeared only when a product created under the new `ProductAdded` topic was removed and `Product.load(...)!` hit null. It is deterministic: rewinding, resyncing or another indexer reproduces it, so indexers can do nothing. The owner must publish the new ABI, add a V5 data source from block 47,591,975, replace the `!` loads with null checks, and deploy a new version (full resync). General rule: `unexpected null` in a removal, update or transfer handler usually means the creation event stopped arriving earlier; check the proxy implementation slot first.

## How to check
```sh
cast storage --rpc-url $RPC $CONTRACT 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --block $B
```
at blocks between last-known-good and now; if the implementation changed, `cast keccak` each ABI event signature and grep `cast code` of the new implementation (and its libraries) for it. Missing topics are events you no longer receive. Manifest network: `curl -s "https://api.thegraph.com/ipfs/api/v0/cat?arg=<Qm>" | grep network`.

## Facts worth keeping
- Subgraph `HCoNL7MuVQqbLkBsXVHrZB8cQsKB2Z99EJ3mv9ED4578`, deployment `Qmc6xj1coV6kae7hnj83rZAUUaFUCJZBUWuZYoJGaZYe9F`; published on Arbitrum, indexes Base.
- Proxy `0xb9d5B99d5D0fA04dD7eb2b0CD7753317C2ea1a84`; implementation `0x086494e2…` at 47,591,974, `0x660222c3…` at 47,591,975, current `0x0901c431…` (2026-06-27).
- Only `CategorySet` and `ProductRemoved` survive. Old `ProductAdded` topic `0x46fd72a3…`, new `0x9d7ab943…`.
- New ABI unverified anywhere (libraries `0xd3a03e41…`, `0xe6d2f690…`); `slice-so/subgraph` archived 2025-08-28.
- Owner of subgraph NFT and contracts: `0xAe009d532328FF09e09E5d506aB5BBeC3c25c0FF`.
- Reported by Tehn.

## May have changed
Slice publishing a new subgraph version.
