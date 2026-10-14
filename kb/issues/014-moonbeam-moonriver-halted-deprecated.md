# #14 Moonbeam, Moonriver and Moonbase Alpha halted: subgraphs frozen, not broken

**Status:** closed (handed-off) · **Area:** indexer, rpc · **Owner:** foundation · **Last checked:** 2026-10-05

**Asked as:** "Moonbeam subgraph not updating", "Moonbeam stopped producing blocks", "Moonriver subgraph stale", "_meta timestamp stuck on 2026-08-10", "rpc.api.moonbeam.network does not resolve", "is Moonbeam still supported on The Graph", "GLMR migrated to Base".

## Answer
Moonbeam halted at block 16,796,699 (2026-08-10T11:36:12Z) and Moonriver at 17,381,654 (2026-08-10T08:27:48Z); Moonbase Alpha's last observed block was 17,159,874 (2026-07-30T14:31Z), later unreachable. Moonbeam relaunched on Base; the Moonbeam team said no more blocks will be produced. Subgraphs on these chains look perfectly healthy (at head, no indexing errors, attested) and serve the same answer forever; historical data is still correct. Anything needing new data must move to a new subgraph on Base (new addresses, deployment, start block). The networks registry deprecated all three from Studio on 2026-08-18 and removed Moonbeam's indexing rewards on 2026-10-01.

## How to check
- `{ _meta { block { number timestamp } hasIndexingErrors } }`: timestamp not advancing and stuck on 2026-08-10 means the chain halt.
- `eth_getBlockByNumber("latest")` and read the timestamp (e.g. `moonbeam-rpc.publicnode.com`, `moonriver-rpc.publicnode.com`, `https://1rpc.io/glmr`).
- Client-side: alarm when `_meta.block.timestamp` lags wall clock beyond what block time allows.

## Facts worth keeping
- Announcement: https://moonbeam.network/news/moonbeam-strategic-update-moonbeam-network-relaunches-on-base/ (transition to 2026-07-31).
- `rpc.api.moonbeam.network` no longer resolves in DNS (2026-09-08). 16,796,699 is the highest block observed, not certified; `1rpc.io` once returned 16,796,187 from a lagging backend.
- Deprecation commit: graphprotocol/networks-registry@5f53034 (rewards removal); registry lists no Subgraph service for Moonbeam or Moonriver, Moonbase Alpha removed.
- Yash (Edge & Node) escalated to Moonbeam and confirmed deprecation 2026-08-11. Spotted by Tehn and Marc-André (Ellipfra). Related: #15 (halted chain looks healthy; Lodestar v4.23.0 chain liveness).
