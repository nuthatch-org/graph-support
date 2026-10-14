# #19 Upgrade indexer unhealthy on an un-try_'d contract call

**Status:** closed (root-cause-found) · **Area:** area/studio, area/graph-node, area/rpc · **Owner:** owner/edge-and-node, owner/reporter · **Last checked:** 2026-09-08

**Asked as:** "Call reverted, probably because an `assert` or `require` in the contract failed, consider using `try_feeGrowthGlobal1X128` to handle this in the mapping", "Mapping aborted at ~lib/@graphprotocol/graph-ts/chain/ethereum.ts", "The Upgrade Indexer has a non-fatal error", "I'm rewinding the deployment", "health: unhealthy", "nonFatalErrors", "other indexers passed the block", "rewind didn't fix it".

## Answer
`handleSwap` called `feeGrowthGlobal1X128` without the `try_` wrapper, so a revert aborts the handler. Why it reverted on the upgrade indexer at block 72,411,511 but not on ellipfra is unexplained; an archive-state cause was suggested as inference and never confirmed or refuted. E&N's rewind did not work: the upgrade indexer had already pruned the needed history (it keeps ~1,000 blocks), so a non-fatal error recorded outside a pruned indexer's retention window is permanent for that deployment on that indexer. The fix is the developer's: handle reverted calls with `try_` and ship a new deployment. A deployment with non-fatal errors errors on queries unless they use `subgraphError: allow`.

## How to check
```graphql
{ indexingStatuses(subgraphs: ["Qm…"]) {
    health nonFatalErrors { message block { number } deterministic }
} }
```
against `https://indexer.upgrade.thegraph.com/status`. Compare `earliestBlock` with the error block to see if a rewind can reach it.

Fix:
```ts
let result = pool.try_feeGrowthGlobal1X128()
let feeGrowth = result.reverted ? BigInt.zero() : result.value
```
Docs: https://thegraph.com/docs/en/subgraphs/developing/creating/graph-ts/api/#handling-reverted-calls

## Facts worth keeping
- Deployment `QmQTCx7o6NW9SdJuyQSCYz71YLm3K43dkmtjZ38hbqvwPL` (`squadswap-wow-v2`, BSC); upgrade indexer `0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491`.
- Error tx `eacafaa6144336f01cbad9f7892cfa2ac6c7a68e56b48adeca2c66c95e7a29b9`, block 72,411,511.
- Resync measured ~41.4 blocks/s vs BSC ~2.2 blocks/s; while behind it shows in gateway maps as `Unavailable(TooFarBehind)`, unrelated to the error.
- Jerry (Edge & Node), 2026-08-13: "I wasn't able to rewind far enough to resolve it because the required history had already been pruned by the Upgrade Indexer."
- Related: #11 (`Contract call reverted, reason: empty response`), #18.

## May have changed
Upgrade indexer ownership moved from Edge & Node to the Foundation after this thread.
