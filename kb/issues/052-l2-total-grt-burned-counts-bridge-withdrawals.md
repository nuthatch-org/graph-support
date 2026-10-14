# #52 L2 network subgraph totalGRTBurned is 99% bridge withdrawals

**Status:** open (status/handed-off, root-cause-found, reference) · **Area:** area/horizon · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "how much GRT has been burned"; "GraphNetwork.totalGRTBurned"; "totalGRTBurned is wrong on Arbitrum"; "GRT burn number too high"; "totalGRTMinted includes deposits"; "bridgeBurn counted as burn".

## Answer
The network subgraph's `src/mappings/graphToken.ts` treats any `Transfer` to the zero address as a burn and from it as a mint. On L2, `L2GraphToken.bridgeBurn`/`bridgeMint` emit exactly those Transfers when GRT crosses the bridge, and `l2Gateway.ts` never subtracts them, so L2 `totalGRTBurned` is about 99.23% withdrawals to L1 and `totalGRTMinted` includes deposits. `totalSupply` and L1 figures are unaffected. Use `realBurned = L1.totalGRTBurned + (L2.totalGRTBurned - L2.totalGRTWithdrawn)` and `realL2Minted = L2.totalGRTMinted - L2.totalGRTDepositedConfirmed`. The fix belongs upstream (graph-network-subgraph#337), which had no response or PR as of 2026-10-08.

## How to check
- Example tx `0xf5cf39ef…dfe22`, Arbitrum block 510908609: only a 50,000,000 GRT Transfer to zero, `BridgeBurned`, ArbSys message and `WithdrawalInitiated`, yet `totalGRTBurned` rises by 50M.
- Source: graph-network-subgraph `src/mappings/graphToken.ts` lines 26-37 (at `3f857e2`), `src/mappings/l2Gateway.ts`.

## Facts worth keeping
- Reporter PaulieB14, graph-network-subgraph#337 (7 Oct 2026); shared by the Graphtronauts.
- Reproduced to the wei: Arbitrum gross 1,326,791,691.745, withdrawals 1,316,538,491.385, real burned 10,253,200.360 (664,012 burn logs); mainnet 27,088,912.106; about 37.34M GRT burned across both chains.
- Arbitrum real burns: 9.66M HorizonStaking, 362k L2Curation, 230k GraphPayments.
- Corrected figures live in kittiwake#203 (merged 2026-10-07 17:50 UTC) and lodestar#327 (18:00 UTC).

## May have changed
A fix landing in graph-network-subgraph#337 and a new network subgraph version.
