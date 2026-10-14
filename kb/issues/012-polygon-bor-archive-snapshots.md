# #12 Polygon bor archive snapshots: sizes, gaps, and how to verify one

**Status:** open (status/investigating, reference) · **Area:** rpc · **Owner:** none · **Last checked:** 2026-10-09

**Asked as:** "Polygon archive snapshot", "bor archive snapshot", "where can I get a bor archive snapshot", "how big is a Polygon archive node", "stakecraft snapshot gaps", "stakepool bor-mainnet_49", "official Polygon archive snapshot".

## Answer
There is no good, recent, complete bor archive snapshot; plan for that. A bor archive node is about 12.6TB. stakepool `bor-mainnet_49.tar.zst` is complete as far as known but at block 80,122,748, about 8 months old at filing; stakecraft is recent but has several gaps; "stateless" snapshots are not archive; the official Polygon archive snapshot has been promised but not delivered. Verify any snapshot before trusting it by `eth_call` at known-gap blocks and scattered blocks against a known-good provider. Provenance (inference from operators, not providers): an early invalid stakepool snapshot was the base for stakecraft's, and stakepool had to resync from scratch.

## How to check
- `eth_call` a contract that certainly had state at blocks **35,009,698** and **66,049,889** (expose the stakecraft gaps); empty where state is expected means a holed snapshot.
- Generalise: scattered blocks across the range, compared against a known-good provider, before pointing graph-node at it.

## Facts worth keeping
- Several large indexers moved off Erigon for Graph workloads citing chain-head RPC bugs (Matthew Darwin of Pinax, Ellipfra).
- 2026-10-09 recheck: no new archive snapshot announced since August; latest bor release v2.10.2 (30 September).
- Credit: Marc-André (Ellipfra) for sizing, verification blocks and provenance; JB273 (p-ops2.eth) and IroqouisPliskin for tracking releases.

## May have changed
An official Polygon archive snapshot or a new verified-clean snapshot would make this obsolete.
