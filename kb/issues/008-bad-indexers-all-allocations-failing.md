# #8 Bad indexers: every allocated indexer failing, each for a different reason

**Status:** closed (root-cause-found) · **Area:** gateway · **Owner:** indexer · **Last checked:** 2026-08-11

**Asked as:** "bad indexers: {... Unavailable(too far behind), BadResponse(400), BadResponse(no attestation: indexing_error), Unavailable(no status: indexer not available)}", "every indexer fails on my subgraph", "Uniswap V4 subgraph not queryable", "no healthy indexer for my deployment".

## Answer
When the per-indexer reasons in a `bad indexers` map disagree and none is healthy, there is no single shared cause: nobody is successfully serving the deployment and each operator has fallen over independently. No query change, pinned block or retry helps. `no attestation: indexing_error` is deterministic; those operators will not recover without a human. Confirm it is the deployment (check each allocation's state), contact the operators by address starting with the `indexing_error` ones, and signal/curate if you want more operators on it. Meanwhile a consumer has no lever; design around this.

## How to check
- Look up the deployment ID and each allocation's state (e.g. Lodestar, indexer status endpoints).
- Decode each reason per #1.

## Facts worth keeping
- Reported case: six indexers on a Uniswap V4 subgraph: two `indexing_error` (`0xe13840a2...`, `0xf92f430d...`), two `BadResponse(400)`, one `too far behind` (`0x3b9ba748...`), one `no status`.
- Explorer search returning nothing, seen by the same reporter, is separate: #9.
- Triaged by petko (The Night's Watch).
