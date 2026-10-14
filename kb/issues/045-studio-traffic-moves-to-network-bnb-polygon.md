# #45 Studio query traffic moves to the Network: BNB and Polygon from 8 October, Studio ends 31 October

**Status:** open (status/investigating, reference) · **Area:** area/studio, area/gateway · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "Studio migration to the network"; "Studio deprecation BSC Polygon"; "when does Studio stop serving my subgraph"; "which subgraphs are being migrated"; "my subgraph has signal but no indexers"; "Unavailable(no allocations)" after publishing; "Unavailable(too far behind)" right after publishing; "should indexers scale up for the Studio migration".

## Answer
The Graph Foundation moves Studio staging query traffic for BNB Smart Chain and Polygon subgraphs to the network on 8 October 2026 and ends Studio support for them by 31 October 2026; it will not publish the list of affected subgraphs (about 450). A bot curates on published BNB/Polygon subgraphs (guaranteed only through 8 October, fixed budget). The silent failure is a deployment with signal and zero allocations; this issue tracks that list from on-chain signal via Lodestar. For developers: `too far behind` in the first hours is normal syncing; `no allocations` an hour after signal is not; `no attestation: indexing_error` on every indexer means the subgraph fails deterministically. Keep the Studio endpoint alive until the network one answers, and check manifests are not CRLF (`file subgraph.yaml`) before `graph publish` (see #41). Indexers: do not scale up without coordinating with the Foundation; allocating to listed deployments on chains you already run is the free option.

## How to check
- Lodestar API `subgraph-directory` with `indexersMax=0&signalMin=1`, filtering rows with `indexerCount` 0 (lodestar#297 migration page).
- `file subgraph.yaml` to detect CRLF before publishing.

## Facts worth keeping
- Announced by BK (Graph Foundation) in #indexers 24 Sep 2026 and Graph Office Hours #276 (22 Sep).
- Signalled-but-unallocated: 24 Sep bsc 117, matic 165; 8 Oct bsc 109 (1 at or above 500 GRT), matic 158 (2 at or above 500 GRT).
- Largest: bsc `QmXMFezqpyMKB4Am4qtfpYdPDptNcWtAUDzaVnk7cW9Hhx` (~1,134 GRT, name signal from L2GNS, Nov 2025); matic `QmW4Vo3ZYV79pizzYKbNZ2TTKfHQhdRQDrmGDG25UkBpuz` (~10,673 GRT).
- Curation bot address not known yet.
- Links: nightswatchhq/lodestar#295, #297; graph-academy-v2#17. Related: #46 (REO 5 subgraphs), #32, #37, #39, #53, #57.
- Open questions to the Foundation: fate of signal with no allocation, curation budget, which Studio subgraphs already fail, next chains.

## May have changed
After 31 October Studio no longer serves BNB/Polygon; further chains may follow.
