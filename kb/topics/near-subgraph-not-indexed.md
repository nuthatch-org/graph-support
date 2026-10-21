# NEAR subgraph not indexed: "must exist on the Ethereum network" and no indexers

**Last checked:** 2026-10-21

**Asked as:** "subgraph validation error: the specified block N must exist on the Ethereum network" on a NEAR subgraph; "Studio shows PUBLISHED but SUBGRAPH NOT INDEXED, no logs"; "deployment `uX/sY/vZ` does not exist"; "Explorer shows No Indexers available" for a NEAR deployment; "the block is on FastNEAR's archive RPC".

## Answer
The validation error is graph-node's generic start-block check, and its text names Ethereum for every chain. For a NEAR subgraph graph-node never asks an RPC: it asks its NEAR Firehose for the block before the lowest `startBlock`, so a block being on FastNEAR or any NEAR RPC proves nothing. The error means Studio's NEAR Firehose did not answer. The manifest is not at fault and redeploying the same artifact will fail the same way; only Edge & Node, who run Studio, can fix that side, through Studio support.

"No Indexers available" on the network is separate. Check who has allocated: on `namesky-production` the only indexer ever was the upgrade indexer, which closed its allocation on 2026-10-20 as part of a batch of about 1,700 closures across every chain that afternoon. `near-mainnet` has `issuanceRewards: false` in the networks registry, so no indexer earns rewards on it; with no curation signal either, someone running NEAR Firehose has to choose to allocate. Ask in #indexers. No history is lost by waiting: an indexer that picks it up indexes from `startBlock`.

## How to check
- graph-node: the message is `SubgraphManifestValidationError::BlockNotFound` (`graph/src/data/subgraph/mod.rs:362` at `84537ed21`); it is raised by `resolve_start_block` in `core/src/subgraph/registrar.rs`, which calls `block_pointer_from_number(min_start_block - 1)`; NEAR's implementation (`chain/near/src/chain.rs:209`) asks the Firehose endpoint, never an RPC.
- Networks registry: `curl -s https://networks-registry.thegraph.com/TheGraphNetworksRegistry.json | jq '.networks[]|select(.id=="near-mainnet")|{issuanceRewards,services,firehose}'`. On 2026-10-21: `issuanceRewards: false`, Studio and gateway listed, Firehose `mainnet.near.streamingfast.io:443`, first streamable block 9,820,210.
- Allocations nest: `subgraph_service__allocation_created` / `_closed` and `staking_legacy__allocation_created` filtered on the deployment's bytes32 (the base58 Qm hash decoded, `1220` prefix dropped); `curation__signalled` for signal.
- Manifest: `curl -X POST "https://ipfs.thegraph.com/api/v0/cat?arg=<Qm...>"`.

## Facts worth keeping
- Case: `namesky-production`, deployment `QmexH7WSu2B5JEFGTHAcmTa5A9fSthNUnZUYMHAA2VDBbE` (bytes32 `0xf6db7b0e…cb29`), `kind: near`, `network: near-mainnet`, `startBlock: 91294704`, receipt handlers on `*.namesky.near` accounts.
- Upgrade indexer `0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491`: 13 legacy allocations to this deployment from 2024, a Horizon one opened 2026-03-26, closed 2026-10-20 18:25 UTC (Arbitrum block 516678597), not force-closed. No curation signal ever.
- The 2026-10-20 batch: the upgrade indexer closed 1,723 allocations between 17:00 and 21:00 UTC and kept 1,696 open. Neither signal nor chain separates the two groups: about half of each had ever been signalled, and a 40-deployment sample of each was mostly mainnet, Base and BSC on both sides. Why it closed them is not known.

## May have changed
Studio's NEAR Firehose may be repaired, or NEAR may be the next chain moved off Studio after BNB and Polygon (#45). The upgrade indexer may reopen allocations.
