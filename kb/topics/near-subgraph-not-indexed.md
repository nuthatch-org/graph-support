# NEAR subgraph not indexed: "must exist on the Ethereum network" and no indexers

**Last checked:** 2026-10-21

**Asked as:** "subgraph validation error: the specified block N must exist on the Ethereum network" on a NEAR subgraph; "Studio shows PUBLISHED but SUBGRAPH NOT INDEXED, no logs"; "deployment `uX/sY/vZ` does not exist"; "Explorer shows No Indexers available" for a NEAR deployment; "the block is on FastNEAR's archive RPC".

## Answer
NEAR was deprecated on The Graph on 16 October 2026, announced in the Discord #announcements channel (pointed out by Maks in #subgraph-development, 2026-10-21; the first answer here missed it and told the developer to open a Studio ticket). Studio no longer indexes NEAR, which is why a deployment shows SUBGRAPH NOT INDEXED, its query URL answers "does not exist", and a redeploy fails. Nothing on the developer's side fixes it; the way forward is a NEAR indexer outside The Graph.

Why the redeploy error reads as it does: it is graph-node's generic start-block check, and its text names Ethereum for every chain. For a NEAR subgraph graph-node never asks an RPC: it asks its NEAR Firehose for the block before the lowest `startBlock`, so a block being on FastNEAR or any NEAR RPC proves nothing. Studio's NEAR Firehose no longer answers.

The network will not pick it up either, in practice. Nothing in the protocol stops an indexer allocating to a NEAR deployment, but `near-mainnet` has `issuanceRewards: false`, the only listed Firehose is StreamingFast's, and after the deprecation no indexer has a reason to run one. On `namesky-production` the only indexer ever was the upgrade indexer, which closed its allocation on 2026-10-20.

## How to check
- graph-node: the message is `SubgraphManifestValidationError::BlockNotFound` (`graph/src/data/subgraph/mod.rs:362` at `84537ed21`); it is raised by `resolve_start_block` in `core/src/subgraph/registrar.rs`, which calls `block_pointer_from_number(min_start_block - 1)`; NEAR's implementation (`chain/near/src/chain.rs:209`) asks the Firehose endpoint, never an RPC.
- Networks registry: `curl -s https://networks-registry.thegraph.com/TheGraphNetworksRegistry.json | jq '.networks[]|select(.id=="near-mainnet")|{issuanceRewards,services,firehose}'`. On 2026-10-21: `issuanceRewards: false`, Studio and gateway listed, Firehose `mainnet.near.streamingfast.io:443`, first streamable block 9,820,210.
- Allocations nest: `subgraph_service__allocation_created` / `_closed` and `staking_legacy__allocation_created` filtered on the deployment's bytes32 (the base58 Qm hash decoded, `1220` prefix dropped); `curation__signalled` for signal.
- Manifest: `curl -X POST "https://ipfs.thegraph.com/api/v0/cat?arg=<Qm...>"`.

## Facts worth keeping
- Case: `namesky-production`, deployment `QmexH7WSu2B5JEFGTHAcmTa5A9fSthNUnZUYMHAA2VDBbE` (bytes32 `0xf6db7b0e…cb29`), `kind: near`, `network: near-mainnet`, `startBlock: 91294704`, receipt handlers on `*.namesky.near` accounts.
- Upgrade indexer `0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491`: 13 legacy allocations to this deployment from 2024, a Horizon one opened 2026-03-26, closed 2026-10-20 18:25 UTC (Arbitrum block 516678597), not force-closed. No curation signal ever.
- The 2026-10-20 batch: the upgrade indexer closed 1,723 allocations between 17:00 and 21:00 UTC and kept 1,696 open. Neither signal nor chain separates the two groups: about half of each had ever been signalled, and a 40-deployment sample of each was mostly mainnet, Base and BSC on both sides. Why it closed them is not known; the NEAR deprecation four days earlier may be part of it.

## May have changed
Whether StreamingFast keeps the NEAR Firehose running, and whether the gateway still routes NEAR queries, after the deprecation. The announcement text itself is in Discord only; quote it here once someone pastes it.
