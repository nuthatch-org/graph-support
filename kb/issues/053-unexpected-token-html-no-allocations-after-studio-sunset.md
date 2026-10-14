# #53 "Unexpected token '<' ... is not valid JSON": BSC subgraph with no allocation after Studio moved traffic

**Status:** closed (root-cause-found, fixed) · **Area:** area/studio · **Owner:** owner/foundation · **Last checked:** 2026-10-09

**Asked as:** "Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"; "SyntaxError: Unexpected token '<'"; "subgraph stopped indexing and returns HTML"; "subgraph not found: no allocations"; "query broke after Studio BNB/Polygon migration".

## Answer
`openloom-bsc` had no indexer on the network since 2026-07-02 (Pinax closed its last allocation); the app had been relying on Studio, which began moving BNB Chain and Polygon traffic to the network on 2026-10-08 (#45). With nobody allocated, queries had nowhere to go; the indexing stop and the error were the same event. The `Unexpected token '<'` error is a client `JSON.parse`-ing an HTML error page; the thread first attributed the HTML to a proxy (gateway and Studio answered JSON in tests), and the closing comment calls it the gateway's HTML error page. Fix is an allocation by an indexer that is caught up, not a redeploy: BK (Graph Foundation) added signal and asked in Discord, Ellipfra allocated and reached BSC head by 2026-10-09. Signal alone is not enough until someone has synced; also log HTTP status and body instead of parsing blindly.

## How to check
- Query the gateway directly with your key; `{"errors":[{"message":"subgraph not found: no allocations"}]}` means nobody serves the deployment.
- Network subgraph for active allocations and signal on the deployment.
- Indexer `/status` `indexingStatuses` for the deployment: need `synced: true` at chain head. `synced: true` can be wrong (Ellipfra read `synced: true` while ~48M blocks behind on 2026-10-08).

## Facts worth keeping
- Subgraph `ExnQmsx3oji3gHUPoftijEF2aJ6LANAA5fWADXVzR89U`, deployment `QmXsbGm5Mbm9H5HWrt11uwWSf58MyaxjspF4TNYx166Xgz`, network bsc, 125.8 GRT signal at report.
- Past allocators: braindexer, StreamingFast, LunaNova, SunTzu, Pinax (`0x3717cef8…`, last, to 2026-07-02), upgrade indexer (`0xbdfb5ee5…`, closed 2025-09-05).
- Ellipfra `0xf92f430d…a6d4` allocated at Arbitrum block 512912920; at BSC head 126,641,736 on 2026-10-09.
- Last on-chain activity a `Mint` on 2026-05-19 (the first comment's "only Card emitted, last event March" was corrected).
- A stopgap nest answered the deployment's GraphQL except `DailyState` and `Distribute.operator`.
- Foundation announcement: https://thegraph.com/blog/subgraph-studio-traffic-to-network/

## May have changed
Single allocation; if Ellipfra closes it the deployment is unserved again.
