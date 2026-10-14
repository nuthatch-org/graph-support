# #37 Messari Goldfinch Ethereum fails: "market 0x8481a6eb... TVL -661569.458248 < 0" in handlePrincipalWrittenDown

**Status:** closed (root-cause-found) · **Area:** area/graph-node · **Owner:** owner/upstream (Messari) · **Last checked:** 2026-10-09

**Asked as:** "Mapping aborted at src/mappings/senior_pool.ts, line 503, column 3, with message: market 0x8481a6ebaf5c7dabc3f7e09e44a89531fd31f822 TVL -661569.458248 < 0", "handlePrincipalWrittenDown at block #25964594", "Goldfinch subgraph failed".

## Answer
A deterministic failure in the subgraph's own code. One transaction made the Goldfinch SeniorPool emit eleven `PrincipalWrittenDown` events totalling -34,548,453.85 USDC; the mapping adds each write-down to its own running `totalDepositBalanceUSD` and `assert`s TVL is non-negative, so it aborts. Every indexer stops at block 25964594; resync, RPC changes or graph-node upgrades will not help. If allocated, close the allocation. Only Messari can fix it (remove the assert or clamp at zero, then republish); no new version appeared within a month.

## How to check
`Mapping aborted at src/<file>, with message:` is the subgraph's own abort; read that file and line in the subgraph repo (`subgraphs/goldfinch/src/mappings/senior_pool.ts` in messari/subgraphs) before touching the indexer.

## Facts worth keeping
- Deployment `Qma4UYCL7S7cLq3yqGNWzWWDHjZM49mtiTMT1TzMMPMJo2`, subgraph `GRwpFCPY...sRHr`, network mainnet. Block 25964594 (`8e2b2a6f...b651`), tx `0x1f22f63a...61fb`.
- Source matches deployment: last `subgraphs/goldfinch` commit `ae673cb4` (25 Jan 2024), deployment 2 Feb 2024.
- AssemblyScript abort becomes `DeterministicHostError` (`runtime/wasm/src/host_exports.rs`).
- ~996 GRT signal, no active allocations. Earlier Goldfinch errors fixed via messari/subgraphs issues like #2460. Not raised with Messari.
- Reporter: Tehn.

## May have changed
Messari publishing a new Goldfinch version.
