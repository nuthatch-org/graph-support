# Knowledge base

Insider notes for answering Graph support questions. The issues are the record; these are the distilled answers, written to be grepped by the words people actually use. Ask-graphy bundles this directory and `reference/` into its prompt at build time.

Search first: `grep -ril "<error text>" kb reference`.

## Topics

- [Disputes and self-signalling](topics/disputes-and-self-signalling.md) - self-signal schemes have been slashed (GDR-15, Dispute #3); testnets earn rewards; how to check it in the alloc nest; the October 2026 Sepolia case
- [Closing allocations](topics/closing-allocations.md) - IE067, IE068, IE084, IE015, zero-POI closes, the batch trap, thawing and over-allocation
- [Who runs what now](topics/who-runs-what-now.md) - the Foundation handover, the 13 October stand-down, the TAP sender
- [Finding things out without keys](topics/research-paths.md) - Explorer data, `/status` hosts, logs when RPCs refuse
- [Reproducing faults locally](topics/repro-recipes.md) - throwaway graph-node, wasm harness, matchstick
- [NEAR subgraph not indexed](topics/near-subgraph-not-indexed.md) - NEAR deprecated on The Graph 16 October 2026; "must exist on the Ethereum network" is the Firehose start-block lookup, not an RPC; the upgrade indexer's 20 October batch of closures

## Issues

- [#1 What each reason in a "bad indexers" error means](issues/001-bad-indexers-error-map.md) - closed (root-cause-found, reference)
- [#2 Studio /version/latest serves the published version, not the newest deployment](issues/002-studio-version-latest-serves-published.md) - closed (root-cause-found)
- [#3 Studio deploy fails with ECONNREFUSED to a private 10.x address](issues/003-studio-deploy-econnrefused-private-ip.md) - closed (fixed)
- [#4 Skip argument capped at 20000 by an indexer's GRAPH_GRAPHQL_MAX_SKIP](issues/004-skip-argument-max-20000.md) - closed (root-cause-found)
- [#5 One indexer returns [] while the rest return rows (silent divergence)](issues/005-one-indexer-returns-empty-divergence.md) - closed (root-cause-found)
- [#6 IPFS-derived field is null and never fills in: graph-node does not retry ipfs.cat](issues/006-ipfs-field-null-no-retry.md) - closed (root-cause-found)
- [#7 Subgraph data stops at a date but the subgraph is at chain head](issues/007-data-stops-at-date-contract-went-quiet.md) - closed (root-cause-found)
- [#8 Bad indexers: every allocated indexer failing, each for a different reason](issues/008-bad-indexers-all-allocations-failing.md) - closed (root-cause-found)
- [#9 Graph Explorer search returns no results](issues/009-explorer-search-no-results.md) - closed (fixed, handed-off)
- [#10 Subgraph stuck at 99% synced and not advancing](issues/010-studio-stuck-at-99-percent.md) - closed (root-cause-found, client-side half only)
- [#11 base-reth-node 1.2.0 storage v2: "Contract call reverted, reason: empty response"](issues/011-base-reth-storage-v2-empty-response.md) - closed (out of scope, unresolved)
- [#12 Polygon bor archive snapshots: sizes, gaps, and how to verify one](issues/012-polygon-bor-archive-snapshots.md) - open (status/investigating, reference)
- [#13 Celo subgraphs stuck ~89h while the sole indexer reports healthy against a frozen chain head](issues/013-celo-frozen-chain-head-reports-healthy.md) - closed (root-cause-found)
- [#14 Moonbeam, Moonriver and Moonbase Alpha halted: subgraphs frozen, not broken](issues/014-moonbeam-moonriver-halted-deprecated.md) - closed (handed-off)
- [#15 A halted chain looks like a perfectly healthy subgraph](issues/015-halted-chain-looks-healthy.md) - closed (root-cause-found, reference)
- [#16 Scroll Sepolia halted, Studio still lists it](issues/016-scroll-sepolia-halted.md) - open (root-cause-found, status/handed-off)
- [#17 How the gateway picks indexers, and why placement beats every other lever](issues/017-gateway-indexer-selection.md) - closed (root-cause-found, reference)
- [#18 Unavailable(TooFarBehind) and one indexer holding all the history](issues/018-toofarbehind-pruned-history.md) - closed (root-cause-found)
- [#19 Upgrade indexer unhealthy on an un-try_'d contract call](issues/019-upgrade-indexer-try-call-revert.md) - closed (root-cause-found)
- [#20 Identical PoI reused across epochs on an actively indexing deployment](issues/020-identical-poi-reused-across-epochs.md) - open (status/investigating, reference)
- [#21 Upgrade indexer not allocating to new subgraphs](issues/021-upgrade-indexer-not-allocating.md) - closed (root-cause-found, fixed)
- [#22 New Studio API key returns "API key not found" for minutes](issues/022-new-studio-api-key-not-found.md) - closed (root-cause-found, reference)
- [#23 GIP-0089 Innovation Allocation: 20% of issuance to the Foundation](issues/023-gip-0089-innovation-allocation.md) - open (status/triage, reference, seed)
- [#24 Moving subgraph data between shards and decommissioning a shard](issues/024-graphman-copy-shard-migration.md) - open (status/handed-off, reference)
- [#25 monad-testnet frozen on the upgrade indexer while reporting healthy](issues/025-monad-testnet-frozen-upgrade-indexer.md) - closed (root-cause-found, reference)
- [#26 bad indexers: "Store error: database unavailable" from the sole indexer](issues/026-bad-indexers-database-unavailable.md) - closed (root-cause-found, fixed)
- [#27 unexpected null in handleProductRemoved after a contract upgrade changed event signatures](issues/027-unexpected-null-after-contract-upgrade.md) - closed (root-cause-found)
- [#28 Nothing indexes after upgrading graph-node past 0.42.1: [chains] ingestor mismatch](issues/028-ingestor-node-id-mismatch.md) - closed (root-cause-found)
- [#29 "Index out of range" at Array<ethereum.Log>#at in handleSwapIn after graph-node 0.41.1 -> 0.45.0](issues/029-index-out-of-range-receipt-logs.md) - closed
- [#30 TAP aggregator Cloudflare 526 shows as "invalid compression flag: 101", then denylisted sender](issues/030-tap-aggregator-526-compression-flag.md) - closed (root-cause-found, fixed)
- [#31 Gateway "BadResponse(400)" from a healthy sole indexer that has denylisted the gateway sender](issues/031-bad-response-400-denylisted-sender.md) - closed (root-cause-found, fixed)
- [#32 uniswap-v4-ethereum unhealthy everywhere: "unexpected null" at swap.ts:39 on a pool whose currency reverts on decimals()](issues/032-uniswap-v4-unexpected-null-pool.md) - open (root-cause-found, status/investigating)
- [#33 "Found no transaction for event" at Polygon block 93438795 on the upgrade indexer: corrupt cached block](issues/033-found-no-transaction-for-event-polygon.md) - open (status/needs-info)
- [#34 IE070 "Failed to query graph node for blockHashFromNumber: no data returned": status endpoint on a query node](issues/034-blockhashfromnumber-null-query-node.md) - closed (root-cause-found)
- [#35 "Failed to fetch block hash from number, error: deadline has elapsed": blockHashFromNumber null after 10 s on graph-node 0.43.0+](issues/035-blockhashfromnumber-deadline-elapsed.md) - open (root-cause-found, status/handed-off)
- [#36 "No sender found for signer" on indexer-service 2.0.2: graph_tally_collector_address defaults to 0x4444...](issues/036-no-sender-found-for-signer-collector-default.md) - closed (root-cause-found, fixed)
- [#37 Messari Goldfinch Ethereum fails: "market 0x8481a6eb... TVL -661569.458248 < 0" in handlePrincipalWrittenDown](issues/037-goldfinch-tvl-negative-assert.md) - closed (root-cause-found)
- [#38 "network not supported by registrar: no network robinhood found on chain ethereum": Robinhood Chain not in Studio](issues/038-network-not-supported-by-registrar-robinhood.md) - closed (root-cause-found)
- [#39 "wasm trap: wasm `unreachable` instruction executed" in ~lib/rt/stub/__alloc: Gamma V4 factory exhausts wasm memory](issues/039-wasm-unreachable-alloc-gamma.md) - closed (root-cause-found)
- [#40 "BadResponse(no attestation: indexing_error)" and "Unavailable(too far behind)" on uniswap-v4-ethereum; subgraphError: allow cannot pass the gateway](issues/040-no-attestation-indexing-error-uniswap-v4.md) - open (root-cause-found, status/investigating)
- [#41 "string is not a BigInt: `26956207 `": one CRLF manifest failed every network and analytics subgraph version](issues/041-network-subgraph-crlf-bigint.md) - open (root-cause-found, status/handed-off)
- [#42 closeAllocation reverts "ProvisionManagerInvalidValue(message: 0x746f6b656e73, value: 0 ...)" once the whole provision is thawing](issues/042-close-allocation-provision-thawing.md) - closed (root-cause-found)
- [#43 Receipts refused as "not eligible" because indexer-service reads a frozen network subgraph](issues/043-receipt-allocation-not-eligible-frozen-network-subgraph.md) - open (status/needs-info, kind/symptom)
- [#44 Queries drop after the Graph Tally sender rotation: new sender not in sender_aggregator_endpoints](issues/044-tap-sender-rotation-sender-not-on-list.md) - closed (root-cause-found)
- [#45 Studio query traffic moves to the Network: BNB and Polygon from 8 October, Studio ends 31 October](issues/045-studio-traffic-moves-to-network-bnb-polygon.md) - open (status/investigating, reference)
- [#46 REO from 6 October: an active day needs qualifying queries on 5 subgraphs, applied over the whole window](issues/046-reo-five-subgraphs-per-active-day.md) - open (status/investigating, reference)
- [#47 Escalation page still routed Studio, Explorer, upgrade indexer and gateway to Edge & Node](issues/047-escalation-page-routes-to-edge-and-node.md) - closed
- [#49 "Found no transaction for event" at Base 51606776: upgrade indexer's cached block was spliced](issues/049-found-no-transaction-for-event-spliced-block-cache.md) - open (status/investigating, root-cause-found)
- [#50 "SubgraphStartFailure ... database unavailable" on restart: one slow checkout takes a shard offline, failed starts never retry](issues/050-database-unavailable-subgraph-start-failure.md) - open (status/needs-info, root-cause-found)
- [#51 "Subgraph instance failed to run: store error" after a Postgres blip: deployment frozen but "healthy"](issues/051-store-error-runner-dies-healthy-but-frozen.md) - open (status/handed-off, root-cause-found)
- [#52 L2 network subgraph totalGRTBurned is 99% bridge withdrawals](issues/052-l2-total-grt-burned-counts-bridge-withdrawals.md) - open (status/handed-off, root-cause-found, reference)
- [#53 "Unexpected token '<' ... is not valid JSON": BSC subgraph with no allocation after Studio moved traffic](issues/053-unexpected-token-html-no-allocations-after-studio-sunset.md) - closed (root-cause-found, fixed)
- [#54 bad indexers {LunaNova: Timeout, Ellipfra: BadResponse(no attestation: indexing_error)} on a Base subgraph with two allocations](issues/054-bad-indexers-timeout-indexing-error-two-allocations.md) - open (status/triage, reopened)
- [#55 PancakeSwap V3 BSC failed at 113799774: "function handleSetFeeProtocol not found"](issues/055-function-handler-not-found-pancakeswap-v3-bsc.md) - open (status/triage)
- [#57 Unavailable(too far behind) on Polygon: deployments frozen "healthy" on Ellipfra and LunaNova](issues/057-too-far-behind-polygon-healthy-but-frozen.md) - open (status/triage)
