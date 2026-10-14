# #7 Subgraph data stops at a date but the subgraph is at chain head

**Status:** closed (root-cause-found) · **Area:** graph-node · **Owner:** reporter · **Last checked:** 2026-08-11

**Asked as:** "subgraph data stops at a date", "subgraph is stale / stuck", "no new entities since April", "Polymarket subgraph stopped at 28 April 2026", "enrichedOrderFilleds timestamps end", "which subgraph ID should I use instead".

## Answer
The subgraph was at chain head with no indexing errors; the source contract went quiet. Polymarket cut over from the V1 Exchange to a V2 Exchange, V1 stopped emitting `OrderFilled`, so no new entities were created. Check `_meta` first: if its block tracks chain head and `hasIndexingErrors` is false, indexing is fine and the silence is upstream; look at the contract on a block explorer and point at the new contract or subgraph.

## How to check
- `{ _meta { block { number timestamp } hasIndexingErrors } }`: at chain head means the contract went quiet; far behind means stuck.
- Check the source contract's recent events on a block explorer.

## Facts worth keeping
- Polymarket V1 subgraph was at block 86,599,507 at the time.
- Polymarket V2 subgraph: `FjHkLw5U5Tsr9THKX3HCSxEXjM92GCaPtsxwjge7PaVS`, starts at V1 genesis because Conditional Tokens is unchanged across V1 and V2; backfill estimated about a week at report time.
- Diagnosed by PaulieB.

## May have changed
The V2 subgraph sync estimate is from August 2026 and will be out of date.
