# #54 bad indexers {LunaNova: Timeout, Ellipfra: BadResponse(no attestation: indexing_error)} on a Base subgraph with two allocations

**Status:** open (status/triage, reopened) · **Area:** area/indexer · **Owner:** owner/indexer · **Last checked:** 2026-10-12

**Asked as:** "bad indexers: {0xe13840a2…: Timeout, 0xf92f430d…: BadResponse(no attestation: indexing_error)}"; "BadResponse(no attestation: indexing_error)"; "queries that worked for a year now fail"; "indexer unhealthy but no errors listed"; "Timeout on queries for 100 elements".

## Answer
`bad indexers` means every candidate was rejected, and this subgraph had only two allocations, so either one failing leaves nothing. Ellipfra's copy read `unhealthy` with `fatalError: null` and no non-fatal errors listed; graph-node refuses unattestable queries on a deployment with non-fatal errors unless `subgraphError: allow`, which explains `indexing_error` (why the list was empty is unknown; Ellipfra-side only). LunaNova was healthy and at head, so its `Timeout` is probably query cost on their database (theory, not timed). On 2026-10-12 Ellipfra was healthy but re-indexing from about block 30.7M (inference: dropped the bad copy), so all queries go to LunaNova. Reporter: try smaller `first:` (25 to 50) and fewer nested fields; `subgraphError: allow` is untested here (see #40); the lasting fix is more signal to attract more indexers.

## How to check
- Open allocations: `subgraph_service__allocation_created` minus `allocation_closed` on Lodestar SQL (https://www.lodestar-dashboard.com/sql).
- Each indexer's `/status` for health, errors, synced, latest block.
- Indexer side for the empty-error unhealthy state: `graphman info` and `subgraph_error` rows for the deployment.

## Facts worth keeping
- Subgraph `378iBSg3LF7U4Gby57EsgACtTjjhD55fm7324H58sMeo` (Arbitrum One), deployment `QmTGKYHa6fJhACcfSxiVw69xw55f45xLofPqoQ78wfL55F`, chain base; version set at Arbitrum block 273761382 (12 Nov 2024).
- LunaNova `0xe13840a2…8774` (thegraph.lunanova.tech), 22,194.66 GRT, opened 30 Sep 2026; Ellipfra `0xf92f430d…a6d4` (graph-l2prod.ellipfra.com), 43 GRT, opened July 2026.
- Signal 250.1 GRT on 2026-10-12. Upgrade indexer `/status` returned 403; no allocation.
- Reporter Reshy, 9 Oct 2026, #subgraph-development; Marc-André (Ellipfra) pinged by Graphtronauts.
- Gateway error reference: reference/gateway-errors.md.

## May have changed
Ellipfra finishing its re-index, or new allocations.
