# #39 "wasm trap: wasm `unreachable` instruction executed" in ~lib/rt/stub/__alloc: Gamma V4 factory exhausts wasm memory

**Status:** closed (root-cause-found) · **Area:** area/graph-node · **Owner:** owner/upstream (Gamma Strategies) · **Last checked:** 2026-10-09

**Asked as:** "wasm trap: wasm `unreachable` instruction executed in handler `handle1h` at block #149713338", "~lib/rt/stub/__alloc", "resolveCanonical1dWindow", "calculate24hFees", "deployment silently stopped syncing with no error", "is this graph-node 0.45.0".

## Answer
The mapping ran out of wasm memory in its own code; not graph-node 0.45.0 and not the indexer. The AssemblyScript stub runtime never frees within a handler call, and its `maxOffset = memory.size << 16` wraps in i32 at 65,536 pages, so the effective ceiling is about 2 GiB, not 4. `resolveCanonical1dWindow` walks back one 15-minute bucket at a time to index 0 (~1.97M iterations at this block) when a PairManager is younger than 24 h, allocating each step, and `handle1h` does it twice per young PairManager; with two young PairManagers the fourth scan traps. Reproduced from the deployment's own wasm under wasmtime and V8. Indexers: nothing helps (resync, RAM, version); close the allocation. Gamma must bound the walk and republish. Before the trap, millions of `store.get`s per poll make it look silently stalled (inference).

## How to check
`__alloc` as frame 0 with `unreachable` means wasm memory exhausted within one handler call (deterministic). Look at the frame above the graph-ts frames for a loop whose count comes from chain data (timestamp, block number, counter).

## Facts worth keeping
- Deployment `QmeShW5mr4vCehCpjoAYV881YPQ8AYmDUND2qkeX4kkZnk`, subgraph `RTyLKNTJttWJNDKgzFsQnjG2x4QnGegA3CEDxujZEoQ` (`gamma-uniswap-factory-optimism`, owner `0x91eca5a7b9d28484c4305190866e18e200e308f2`), network optimism, block 149713338. Mapping file `QmT19CJ4...nme9`.
- One full scan costs 0.523 GiB (284.8 bytes/iteration).
- Sibling `gamma-uniswap-factory-ethereum` (`QmcmNNmsyi5xRkXm7krhetDvurJ4NYbQCZZCa646eTEFut`) uses the identical mapping; predicted (not observed) to fail at block 24722953. Gamma's `gamma-hp-*` subgraphs are unaffected.
- Reported by Tehn; error supplied by Marc-André (Ellipfra). Owner not contacted; no public source repo.

## May have changed
Gamma publishing a new version with a bounded walk.
