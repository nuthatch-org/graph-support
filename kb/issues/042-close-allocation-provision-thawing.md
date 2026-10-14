# #42 closeAllocation reverts "ProvisionManagerInvalidValue(message: 0x746f6b656e73, value: 0 ...)" once the whole provision is thawing

**Status:** closed (root-cause-found) · **Area:** area/indexer, area/horizon · **Owner:** owner/upstream (graphprotocol/indexer) · **Last checked:** 2026-10-09

**Asked as:** `ProvisionManagerInvalidValue(message: 0x746f6b656e73, value: 0, min: 100000000000000000000000, max: ...)`, "Unexpected error value ... path closeAllocation", "sunsetting an indexer, thawed all self-stake, cannot close allocations", "how to close allocations without rewards", selector `0x0871e13d`.

## Answer
`0x746f6b656e73` is ASCII `tokens`. `ProvisionManager._checkProvisionTokens` checks `tokens - tokensThawing` against the SubgraphService minimum (100,000 GRT on Arbitrum One), so a thaw request makes the provision invalid from the block it is requested, not when it matures. `collect` requires a valid provision; `stopService` does not. indexer-agent's `closeHorizonAllocation` always collects first (over-allocated: `collect` alone; otherwise `multicall([collect, stopService])`), and no CLI flag skips it, so the close never executes. Fix: send `stopService` yourself from the operator or indexer key (forfeits rewards; works even after deprovision), batched via `multicall`. Or `addToProvision` back over 100,000 GRT to restore the agent path. For sunsets: close allocations first, then thaw.

## How to check
```bash
ARB=https://arb1.arbitrum.io/rpc
SS=0xb2Bb92d0DE618878E438b55D5846cfecD9301105   # SubgraphService
HS=0x00669A4CF01450B64E8A2A20E9b1FCB71E61eF03   # HorizonStaking
cast call $HS "getProvision(address,address)((uint256,uint256,uint256,uint32,uint64,uint64,uint32,uint64,uint256,uint256))" $IX $SS --rpc-url $ARB
# first field minus second < 100,000 GRT = this condition
cast call $SS "stopService(address,bytes)" $IX $(cast abi-encode "f(address)" $A) --from $OP --rpc-url $ARB   # simulate
cast send $SS "stopService(address,bytes)" $IX $(cast abi-encode "f(address)" $A) --rpc-url $ARB --private-key $OPERATOR_KEY
cast send $SS "multicall(bytes[])" "$joined" --rpc-url $ARB --private-key $OPERATOR_KEY   # batch of stopService calldata
```
Stop the agent (or set deployments to `never`) first so it does not race you.

## Facts worth keeping
- Indexer `0xf00f7157fa8fD0420B87956D46058a16B2F23adc` (p2p-org-booster.eth), 105 open allocations, never presented a POI; thaw at block 500769120 (2026-09-01), matured 2026-09-29.
- Forked tests: single `stopService` ~267,922 gas; all 105 in one multicall fit (~13.5M gas estimate); batches of ~25 prudent.
- If nothing is done: after 28 days without a POI (`maxPOIStaleness`), anyone can call `closeStaleAllocation`, which resizes the allocation to zero tokens but leaves it open (permanent zero-token allocation). That is what happened: resized from block 507956600 (2026-09-23) by `0x1af601c4...f257`; no `AllocationClosed` events.
- Agent fix tracked as graphprotocol/indexer#1258 (no activity since 29 September as of 2026-10-08). Thaw warning feature request: graphprotocol/indexer#1169.
- Credit: Sergey K (P2P.ORG). Answer posted in Discord 21 September.

## May have changed
graphprotocol/indexer#1258 landing would give the agent a close path that skips collect.
