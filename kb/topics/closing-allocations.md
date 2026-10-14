# Closing allocations: IE codes, zero POIs and the traps

**Last checked:** 2026-10-14 against `graphprotocol/indexer` at `d216388a` (2026-09-29).

**Asked as:** "how do I close this allocation", "IE084", "IE067", "IE068", "IE015", "tx mined but IE015", "force close", "zero POI", "close with 0x0", "can't close allocation while thawing".

## The codes

| Code | Message | What it means |
| --- | --- | --- |
| IE067 | Failed to query POI for current epoch start block | graph-node has no POI at the epoch start block: deployment behind, failed, or not deployed there. |
| IE068 | User-provided POI did not match reference POI from graph-node | You supplied a POI and graph-node disagrees. `--force` bypasses. |
| IE084 | Could not resolve POI block number | graph-node produced no POI (so the generated block is 0) and you gave no block number. Thrown in `_resolvePOIBlockNumber`, `indexer-management/monitor.ts:1523`. |
| IE015 | Failed to close allocation | Generic. If the tx mined anyway, see over-allocation below. |
| IE070 | Failed to query latest valid epoch and block hash | graph-node `blockHashFromNumber` returned nothing; see #34, #35. |

"Arc" in these questions is the Arc chain (Circle's), which got mainnet subgraph support on 2026-09-16, not shorthand for Arbitrum. The allocation still lives on the protocol network, so `--network arbitrum-one` is right whichever chain the deployment indexes. The question is whether graph-node has synced the Arc deployment to the epoch start block.

An unknown chain alias fails earlier in `resolveChainId`, not as IE084. An old note says IE084 once came from graph-node calling Gnosis `xdai` while the agent knew only `gnosis`; in current source that would surface from `resolveChainId` instead. Treat it as history.

## Closing with a zero POI (no rewards, no slashing risk)

Direct:

```
graph indexer allocations close <allocationID> 0x0000000000000000000000000000000000000000000000000000000000000000 <blockNumber> 0x0000000000000000000000000000000000000000000000000000000000000000 --network arbitrum-one --force
```

Actions queue (argument order `[poi] [force] [blockNumber] [publicPOI]`, `indexer-cli/src/commands/indexer/actions/queue.ts:24`):

```
graph indexer actions queue unallocate <deploymentID> <allocationID> 0x0 true 0 0x0 --network arbitrum-one
```

The CLI normalises `0x0`/`0` to the zero POI and, when the POI is zero, defaults the block and public POI to zero too (`indexer-cli/src/actions.ts:52-67`). A block of `0` counts as provided, so it never reaches the IE084 throw. Credit: mindstyle (pops.one) gave the actions-queue form in Discord, 2026-10-14.

Via the management API (port 8000 inside the agent container, `POST /`, not `/graphql`): `updateActions(filter:{id:N}, action:{poi:"0x00..00", publicPOI:"0x00..00", poiBlockNumber:<n>, force:true, status: approved})`. Enum values unquoted; `cancelActions` takes string IDs.

## Traps

- **The agent executes approved actions as one batch.** One failing action aborts the lot. Cancel the others, let the lone one run, then requeue.
- **Over-allocated after undelegation: tx mines, agent reports IE015, allocation stays open at 0 tokens.** Contracts commit df7f0812 made an over-allocated `collect` resize to zero instead of closing; the agent sent collect only and looked for `AllocationClosed`. Fix is graphprotocol/indexer PR 1258 (closed when the fork went private on 2026-10-13, not merged). Workaround: get under the over-allocation limit, then unallocate again.
- **A thaw request blocks closing at once (#42).** `collect` checks `tokens - tokensThawing` against the 100,000 GRT minimum, `stopService` does not, and the agent always collects first. Escape hatch: call `stopService(indexer, abi.encode(allocationId))` directly. `closeStaleAllocation` after 28 days only resizes to zero.
- **Denied deployment: do not close to tidy up.** `presentPOI` on a denied deployment defers rewards; closing calls `reclaimRewards` and the uncollected rewards go to the reclaim address. Keep it open and present a real POI inside `maxPOIStaleness` (28 days). Read from contracts main, 2026-09-23.

## May have changed

A new indexer-agent release (PR 1258's fix, or IE renumbering), or a contracts upgrade on the SubgraphService.
