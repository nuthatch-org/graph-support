# #55 PancakeSwap V3 BSC failed at 113799774: "function handleSetFeeProtocol not found"

**Status:** open (status/triage) · **Area:** area/graph-node · **Owner:** owner/reporter · **Last checked:** 2026-10-12

**Asked as:** "function handleSetFeeProtocol not found"; "failed to process trigger: block #113799774 … function … not found"; "handler declared in manifest but not exported"; "subgraph stuck at one block on every indexer"; "how to graft past a fatal error".

## Answer
The manifest's Pool template declares an event handler `handleSetFeeProtocol` that the compiled mapping does not export (from the error; subgraph source not read). graph-node resolves handlers only when a trigger fires, so the deployment indexes normally until the first `SetFeeProtocol` event and then fails deterministically on every indexer at the same block. No indexer-side change gets past it. The publisher must export the handler (or drop it from the template), deploy a new version grafted onto this deployment at block 113799772 (graft block must be below the failed block, per Ellipfra), publish, and ask indexers to pick it up. As of 2026-10-12 no fixed version had been published.

## How to check
- Indexer `/status`: `health: failed`, fatal error `function handleSetFeeProtocol not found` at block 113799774.
- Subgraph versions on the network subgraph / Explorer to see whether a fix has been published.

## Facts worth keeping
- Deployment `QmQjVBdmgZdjHpQsXGSC5uryWLmPkkTAunHN2AnDApZBa3`, chain bsc; subgraph `ChmxqA9b…DQ2V`, single version v0 (June 2024).
- Failing block 113799774 (`0x8a4929ae…107f`), tx `5368d0dd…5e`; stuck since about 3 Aug 2026.
- Ellipfra is the only open allocation; 25,803 GRT signal.
- Reported by 112 in #subgraphs-health, 16 Sep 2026; Ellipfra (Marc-André) suggested the graft.

## May have changed
The publisher shipping a fixed, grafted version.
