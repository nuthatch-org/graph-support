# #38 "network not supported by registrar: no network robinhood found on chain ethereum": Robinhood Chain not in Studio

**Status:** closed (root-cause-found) · **Area:** area/studio, area/docs · **Owner:** owner/foundation · **Last checked:** 2026-10-09

**Asked as:** "Could not deploy subgraph on graph-node: network not supported by registrar: no network robinhood found on chain ethereum", "Studio deploy fails for Robinhood Chain", "is Robinhood Chain supported for subgraphs".

## Answer
The network is not enabled in Subgraph Studio; the manifest is fine and `robinhood` is the correct name. "chain ethereum" is the protocol family (`C::KIND`, all EVM chains), not Ethereum mainnet: Studio's graph-node has no EVM chain called `robinhood`. Robinhood Chain (chain id 4663) is supported through Substreams and Firehose only, confirmed by Maks in Discord. Options: wait for the Foundation to add it, or run your own graph-node with `robinhood` configured against a Robinhood RPC (`https://rpc.mainnet.chain.robinhood.com`); the same manifest deploys unchanged.

## How to check
Check the network's `services.subgraphs` in [TheGraphNetworksRegistry.json](https://github.com/graphprotocol/networks-registry/blob/main/public/TheGraphNetworksRegistry.json), or the Subgraphs column of the Supported Networks docs table. Studio-enabled networks list `"subgraphs": ["https://api.studio.thegraph.com/deploy"]`; empty means Studio will refuse.

## Facts worth keeping
- Error source: `graph/src/data/subgraph/mod.rs:302` and `BlockchainMap::get` in `graph/src/blockchain/mod.rs:650` (v0.45.0).
- Registry v0.7.120 (10 Sep 2026): `robinhood` = `eip155:4663`, aliases `evm-4663`, `robinhood-mainnet`, `robinhood-chain`; 64 of 160 networks had Studio subgraph support; `robinhood` and `robinhood-sepolia` did not.
- The per-network docs page links "Subgraph quick start" despite no subgraph support, which misleads.
- Not tested: Substreams-powered subgraph deploys on `robinhood`.
- Reporter Brutality (Uniswap V4 subgraph). New-chain route: the New Chain Integration docs page.

## May have changed
If subgraph support is added, the registry's `services.subgraphs` entry changes first.
