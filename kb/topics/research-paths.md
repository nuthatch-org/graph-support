# Finding things out without keys

**Last checked:** 2026-10-08. Hosts and rate limits drift; re-test before relying on one.

**Asked as:** "who owns this subgraph", "which indexers serve it", "is this indexer healthy", "what does the manifest say", "RPC refuses getLogs".

- **Explorer page `__NEXT_DATA__`**: `thegraph.com/explorer/subgraphs/<id>?view=Indexers&chain=arbitrum-one`
  embeds the subgraph's `displayName`, `owner.id`, version `label`, deployment `ipfsHash` and
  `indexerAllocations`. `explorer/profile/<owner>?view=Subgraphs` lists the owner's other subgraphs.
- **Manifests and mappings**: `POST https://api.thegraph.com/ipfs/api/v0/cat?arg=<hash>`.
- **Per-indexer health**: POST `{ indexingStatuses(subgraphs:[...]) {...} }` to `https://<host>/status`.
  Hosts known to answer: graph-l2prod.ellipfra.com, index.tehn.in, thegraph.lunanova.tech,
  is-big-arbitrum.graph.p2p.org, thegraph-arbitrum.ryabina.io, cp0x-arbitrum.ryabina.io.
- **Status quirks** (#40, 2026-09-15): a multi-deployment `indexingStatuses` query fails whole if one
  deployment sits on a dead shard (`Store error: database unavailable` on p2p), so query one at a time.
  Explorer `indexerAllocations` entries are Indexer objects (`id`, `account.ens`) with no URL, so hosts
  come from this list or the operator. `indexer.upgrade.thegraph.com/status` returned nothing.
- **Logs**: `mainnet.optimism.io` serves `eth_getLogs` in 10k-block chunks. Every public Ethereum
  RPC refused ranges (publicnode 403, drpc 400, llamarpc 525, 1rpc 50 blocks, cloudflare -32046), but
  `eth.blockscout.com/api/v2/addresses/<addr>/logs` pages through all of them without a key.

- **On-chain, no key** (2026-09-16 outage): `arbitrum.blockscout.com/api?module=logs&action=getLogs&fromBlock=&toBlock=&address=&topicN=`
  answers without a key but 429s after ~6 calls. GNS is `0xec9A7fb6CbC2E41926127929c2dcE6e9c5D33Bec`; `SubgraphVersionUpdated`
  is topic0 `0x71d6df5a`, topic1 the subgraph id (base58 of the bytes32 is the Explorer id), topic2 the deployment id
  (`0x1220`+bytes32, base58, is the Qm hash). `AllocationCreated` on the SubgraphService is `0xe5e185fa` with the
  deployment in topic3. A `ServiceRegistered` log with the indexer as topic1 gives the URL (the upgrade indexer is
  `0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491`, and `indexer.upgrade.thegraph.com/status` did answer this time).
- **An indexer's block cache** (#49, 2026-09-28): `{ blockData(network:"base", blockHash:"0x…") }` on `/status` returns
  the cached block JSON. Diff it against `eth_getBlockByNumber` when graph-node disagrees with the chain; upgrade indexer answered.
- **Explorer 404s ("lost in space") on every subgraph page while the network subgraph is failed**, and the SSR
  `__NEXT_DATA__` comes back with empty pageProps. Go on chain instead.

- **Is a TAP sender's aggregator working** (#30 close, 2026-10-08): `cast logs` on GraphTallyCollector
  `0x8f69F5C07477Ac46FBc491B1E6D91E2bb0111A9e` (arb1.arbitrum.io/rpc takes 300k-block ranges). Topic2 is the payer,
  data word 1 of `0x3943fc3b` is `timestampNs`. A redeemed RAV for that payer, timestamped after an outage, proves aggregation works.


The Lodestar directory API that answered "signalled but unallocated per network" went offline on 2026-10-13.

- **Does a chain earn indexing rewards** (2026-10-14): `issuanceRewards` on the chain's entry in `https://networks-registry.thegraph.com/TheGraphNetworksRegistry.json`. Arc mainnet and testnet are `false`. The older `registry.thegraph.com` host did not answer.
