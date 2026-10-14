# #29 "Index out of range" at Array<ethereum.Log>#at in handleSwapIn after graph-node 0.41.1 -> 0.45.0

**Status:** closed · **Area:** area/graph-node, area/indexer · **Owner:** none · **Last checked:** 2026-10-05

**Asked as:** "Mapping aborted at ~lib/array.ts, line 147, column 33, with message: Index out of range", "Array<~lib/@graphprotocol/graph-ts/chain/ethereum/ethereum.Log>#at", "Handler skipped due to execution failure", "SubgraphSyncingFailure", "subgraph failed after upgrading graph-node to 0.45.0", "index out of range in handler handleSwapIn".

## Answer
The backtrace frame `Array<ethereum.Log>#at` means the handler indexed past the end of `event.receipt.logs` (inference from the frame; the mapping source was never read). Two candidates were named: graph-node 0.45.0's #6558, which changed how per-handler `receipt: true` flags merge on a shared filter key (though a null receipt would abort differently), or simply a transaction whose receipt has fewer logs than the mapping assumes. The deciding fact is whether the deployment indexed past the failing block on 0.41.1. The reporter never replied and the issue was closed per TRIAGE.md; no root cause was established.

## How to check
- Did the deployment ever index past the failing block on the old version? If yes, the upgrade changed something; if it stopped there on first attempt, the mapping met a transaction it cannot handle.
- Manifest `receipt` flags for every handler on that contract's events, and whether two handlers share a filter key with different values.
- `graphman info <deployment> --status`.
- Mapping source around the index taken into `event.receipt.logs`.

## Facts worth keeping
- Deployment `QmStfa6zwPUzKHyGrgdNMh8rgbc91sgvmskidBSujG92FR`, sgd 294, failed at block 23238770, tx `0xbf2fb6ba...1085`, address `0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56`, event `SwapRemote(address,uint256,uint256,uint256)`.
- graph-node PR [#6558](https://github.com/graphprotocol/graph-node/pull/6558) (in 0.45.0): `EthereumLogFilter` receipt flags now merged with OR, not overwrite.
- "Handler skipped due to execution failure" is graph-node reverting that handler's writes; later "Committed write batch" lines belong to the block.
- Logs from stake-machine.eth, spotted while diagnosing #28. Compare #27 (contract upgrade changed event signatures, similar presentation).

## May have changed
Reopen welcome if the reporter returns with chain, manifest and graphman status.
