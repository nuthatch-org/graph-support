# #16 Scroll Sepolia halted, Studio still lists it

**Status:** open (root-cause-found, status/handed-off) · **Area:** area/rpc · **Owner:** owner/foundation, owner/upstream · **Last checked:** 2026-10-08

**Asked as:** "Scroll Sepolia network disappeared", "Scroll Sepolia block explorer invalid", "subgraphs stuck at 19039813", "stuck at 0x1228645", "Error:getaddrinfo ENOTFOUND", "No nodes available" (-32055), "sepolia-rpc.scroll.io not working", "sepolia.scrollscan.com 403", "Scroll Sepolia not producing blocks".

## Answer
Scroll Sepolia stopped producing blocks on 2026-07-16; last block is 19,039,813 (`0x1228645`). Every subgraph on it is frozen at that block and will report synced and healthy indefinitely (see #15). Separately the networks registry entry was stale (dead Scroll RPC listed first, dead Blockscout API); that half was fixed by networks-registry#244. An early comment in the thread wrongly called the chain alive because two RPCs agreed on `eth_blockNumber`; it was corrected. Scroll never announced a deprecation. Removing the network from Studio/registry is now the Foundation's job, not Edge & Node's.

## How to check
- `{ _meta { block { number timestamp } hasIndexingErrors } }` on the subgraph: timestamp 2026-07-16 means frozen.
- RPC head block timestamp, not just `eth_blockNumber`.

## Facts worth keeping
- Last block 19,039,813, timestamp 2026-07-16T07:05:07Z.
- graphprotocol/networks-registry#244 merged 2026-08-11: removed `https://sepolia-rpc.scroll.io` from `rpcUrls` and `https://scroll-sepolia.blockscout.com/api` from `apiUrls`; `explorerUrls` left untouched.
- 2026-10-08: no public endpoint answers: `sepolia-rpc.scroll.io` HTTP 526, `scroll-sepolia-rpc.publicnode.com` 403 "unsupported platform", `scroll-sepolia.drpc.org` "chain is not available on free plan", `rpc.ankr.com/scroll_sepolia_testnet` 403, `scroll-sepolia.blockpi.network` 521.
- Registry v0.8.7 still lists `scroll-sepolia` with gateway and Studio services and no `deprecatedAt`.
- Reporter: yash251.

## May have changed
A registry release adding `deprecatedAt` for scroll-sepolia, or Scroll announcing/restarting the testnet.
