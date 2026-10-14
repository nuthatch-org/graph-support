# #5 One indexer returns [] while the rest return rows (silent divergence)

**Status:** closed (root-cause-found) · **Area:** indexer · **Owner:** indexer · **Last checked:** 2026-08-11

**Asked as:** "query returns empty array intermittently", "sometimes returns rows, sometimes nothing", "{\"userReserves\":[]}", "worked for months now returns []", "same query works on another chain", "no error but no data".

## Answer
One allocated indexer had a diverged (wrong) database and was serving an empty result with a valid attestation; the gateway load-balances across indexers, so the user hit it only some of the time. An empty result is not an error: 200, valid GraphQL, valid attestation, so neither the gateway nor the app can tell. An attestation proves the response came from that allocation, not that it is correct. Ask the same query of every allocated indexer at the same block, compare, find the diverging block with the P2P PoI tool, and report to the operator by address; the diverged indexer resynced from scratch and the problem went away.

## How to check
- Query each allocated indexer directly at the same block and diff responses.
- P2P PoI tool: https://github.com/p2p-org/graphprotocol-public-poi-tool (finds the block where two indexers stopped agreeing).

## Facts worth keeping
- Diverged indexer: tehn `0x3b9ba748691f135b71582dc3292e5e3ed7e13341`; healthy ones included lunanova, ellipfra, data, pinax, p2p.
- Divergence began at block 4,365,477. A second operator (Ellipfra) was independently wrong and fixed it with a rewind.
- Diagnosed by Marc-André (Ellipfra); fixed by Tehn by resyncing; tooling by P2P.
