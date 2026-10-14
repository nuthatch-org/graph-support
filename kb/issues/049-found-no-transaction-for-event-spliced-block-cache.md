# #49 "Found no transaction for event" at Base 51606776: upgrade indexer's cached block was spliced

**Status:** open (status/investigating, root-cause-found) · **Area:** area/graph-node, area/indexer · **Owner:** owner/foundation · **Last checked:** 2026-10-12

**Asked as:** "failed to process trigger: block #51606776 (0x5ad73a5f…), transaction e2abc7a3…: Found no transaction for event"; "Found no transaction for event"; "subgraph stuck retrying at one block, transaction exists on chain"; "corrupted cached block"; "block cache corrupt"; "inputaxFeePerGas".

## Answer
The upgrade indexer's chain-store copy of Base block 51606776 had the right header but a spliced transaction list (233 not 234; three canonical txs missing, foreign/fabricated ones present). graph-node looks up the log's transaction hash in the cached block, reads the cache before the RPC, never validates cached completeness, and marks the error non-deterministic, so it retried the same bad copy forever. The chain itself was fine. Fix is on the indexer: `graphman chain check-blocks` diffs cached block JSON against the provider and deletes mismatches, then the retry fetches fresh (`graphman restart` if it stopped retrying). Where the foreign bytes came from (interleaved RPC responses via proxy/LB/provider) is inference. By 2026-10-12 the cached block matched the chain; whether the deployment moved past the block is unconfirmed. Nothing for the subgraph developer to change.

## How to check
- Cached copy: `curl -s https://indexer.upgrade.thegraph.com/status -H 'content-type: application/json' -d '{"query":"{ blockData(network:\"base\", blockHash:\"0x5ad73a5f…\") }"}'` and compare its transaction list with `eth_getBlockByNumber` / `eth_getBlockByHash` on a public RPC. Same hash, different contents = block cache; a different hash = reorg.
- Fix: `graphman --config <config> chain check-blocks base by-hash <hash>` (or `by-number`, `by-range` for neighbours). Caveat: it compares against the node's own RPC, which may be where the splice happened.
- Source: graph-node `chain/ethereum/src/data_source.rs:807`, `graph/src/components/ethereum/types.rs:96`, `chain/ethereum/src/ethereum_adapter.rs:1662`, `node/src/manager/commands/check_blocks.rs:120` (master `6838f4e3c`).

## Facts worth keeping
- Deployment `QmPiDzMEx61GHVwUhyVbsWdY5Wz6fsqdM2kDhNuoJd4YoD`; block hash `0x5ad73a5f09b659977d633b14397fef44c9084c2785528e3e1f4d7829718cfe7f`; tx `0xe2abc7a3…dcc5` (index 1, WETH transfer).
- Missing from cache: `0xe2abc7a3…dcc5`, `0x3af2bf36…440b`, `0x3bfb0a70…db65`; fabricated: `0x2dad4c30…`, `0xbafcb0c3…` (chainId `0x13b2`, blockNumber `0x1501b69`).
- Upgrade indexer node `index_node_studio_1`, failed at latestBlock 51606775.
- Reported by atatakai (25 Sep 2026), whose diagnosis was correct; Jerry picked it up 28 Sep.
- 2026-10-12: cache now 234 txs matching chain; Ellipfra's copy healthy at Base head 52,497,903.
- Same fault on Polygon: #33.

## May have changed
Open until the reporter confirms Studio queries return data past 51606776.
