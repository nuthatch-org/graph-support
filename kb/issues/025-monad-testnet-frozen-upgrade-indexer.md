# #25 monad-testnet frozen on the upgrade indexer while reporting healthy

**Status:** closed (root-cause-found, reference) · **Area:** area/studio, area/indexer, area/rpc · **Owner:** owner/foundation · **Last checked:** 2026-10-09

**Asked as:** "monad-testnet subgraph stopped indexing", "stuck at 53413147", "synced true healthy but no new data", "several deployments stop at the same block", "upgrade indexer Monad", "chainHeadBlock equals latestBlock but chain is ahead", "Monad deprecated in Studio", "is Studio dropping monad-testnet".

## Answer
The upgrade indexer's `monad-testnet` client stopped at block 53,413,147 (2026-08-13 16:21 UTC) while Monad testnet kept producing blocks; every subgraph there still reports `synced: true`, `health: healthy`. The likeliest cause is deliberate: networks-registry@92b20b1 ("deprecate fantom, monad, polygon-zkevm, rootstock") emptied the Subgraph services for monad and monad-testnet 36 minutes before the last indexed block. (An earlier hypothesis about the MONAD_TEN / Phase A node migration is superseded.) The Foundation announced on 2026-10-07 that Studio stops supporting monad-testnet on 2026-10-21. There will be no fix: move monad-testnet subgraphs to another indexer or run graph-node yourself; mappings need no change.

## How to check
Comparing `latestBlock` to `chainHeadBlock` cannot detect a frozen client, since both come from the same node. Compare the indexer's `chainHeadBlock` with an independent RPC:
```
curl -s -X POST https://indexer.upgrade.thegraph.com/status -H 'content-type: application/json' \
  -d '{"query":"{ indexingStatuses(subgraphs:[\"<Qm...>\"]) { chains { network chainHeadBlock { number } latestBlock { number } } } }"}'
curl -s -X POST https://testnet-rpc.monad.xyz/ -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## Facts worth keeping
- Example deployment `QmabZ7MAcKbWxWSDjWtHgCrguz14y4ZFPXa2coyxNfD9nz`.
- Monad testnet head: 57,092,236 (2026-08-26), 60,553,231 (2026-09-08), 68,354,398 (2026-10-05).
- E&N said on 2026-08-26 that Monad had been deprecated in Studio.
- Announcement in #indexers-announcements and #subgraph-development, 2026-10-07.
- Related: #13, #14, #15.

## May have changed
After 2026-10-21 Studio no longer supports monad-testnet at all.
