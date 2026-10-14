# #33 "Found no transaction for event" at Polygon block 93438795 on the upgrade indexer: corrupt cached block

**Status:** open (status/needs-info) · **Area:** area/studio, area/graph-node, area/indexer · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "failed to process trigger: block #93438795 ... transaction cd002eda...: Found no transaction for event", "Studio subgraph stopped on the upgrade indexer", "indexing error but the transaction exists".

## Answer
The transaction is in the canonical block (index 29, status success), so the indexer's cached copy of the block is wrong, not the chain and not the mapping (the handler never runs). graph-node takes the tx hash from the log and searches the block body it holds; the trigger path reads the chain store block cache before RPC and never overwrites an existing row (`upsert_light_blocks` uses `do_nothing`), so a bad row sticks. On 2026-10-08 the upgrade indexer's `blockData` showed 130 transactions vs 127 on chain: the target tx missing, plus three BSC transactions (chainId 0x38, BSC block 118180415) spliced in. The error is non-deterministic, so graph-node retries forever and un-fails itself once the block is fixed; no rewind needed. The fix is `graphman chain check-blocks`, which only the upgrade indexer's operator (now the Foundation) can run.

## How to check
```bash
curl -s <rpc> -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["0x<block>",true]}' \
  | jq '[.result.transactions[].hash] | index("0x<tx from the error>")'
# number back: chain has it, the indexer's cache does not. null: ask a second provider.
graphman --config <config.toml> chain check-blocks <chain> by-number <n>   # diffs cache vs provider, deletes cached row if different
```
Upgrade indexer cache is visible via `blockData(network:"matic", blockHash:"0x...")` on `indexer.upgrade.thegraph.com/status`.

## Facts worth keeping
- Subgraph `9ZVt29ycuVmQTdQPMR5wMDbJ7BJPzYZWQiBPPQG6QTEa`, block 93438795 hash `0x0a30c5b5...31d2`, tx `0xcd002eda1141a6522ab920f0c0b15c04b1d044ce693e8ee5b0099215d76061c8`.
- A block body decoded as hashes rather than full transactions yields an empty `txns()` iterator, so every log in the block fails this way. Header-only or undecodable cache rows are re-fetched, so the bad row decodes fine.
- Non-deterministic retry backs off to `GRAPH_SUBGRAPH_ERROR_RETRY_CEIL_SECS` (default 3600).
- `polygon-rpc.com` answered "API key disabled, reason: tenant disabled" (unrelated).
- Same fault on Base: #49. Reporter 0xLedgerwing; deployment ID never supplied.

## May have changed
Whether the deployment is still stalled was unconfirmed on 2026-10-08 (`indexingStatuses` returned `[]`).
