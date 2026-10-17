# Disputes and self-signalling

**Last checked:** 2026-10-17, against the GDR-15 forum thread and the networks registry v0.8.7.

**Asked as:** "can someone slash this indexer", "he self-signals and harvests rewards", "is self-signalling allowed", "signal and allocate to your own subgraph", "pulls signal when others allocate", "what can be disputed", "testnet rewards farming", "GDR-15".

## Answer

Self-signalling and allocating to the same deployment is not blocked by the protocol, but it **has been slashed** when the arbitrators judged it a scheme against honest indexers. Slashing is not limited to wrong POIs or wrong query answers: a dispute is filed as usual and the Arbitration Council can rule on the Arbitration Charter's core motivation (a healthy network, honest indexers not penalised for acting in good faith).

Precedent:

- **GDR-15** (forum topic 3756, ruled 2023-01-05). Indexer decisionbasis signalled from its own curator address onto a deprecated Convex subgraph version (QmdEPVzd…1sW8C), allocated to it, and pulled the signal after other indexers joined. The arbitrators said at the outset the disputes "do not involve incorrect POIs". They found "intentional behavior that affected the health of the protocol by manipulating the curation mechanism to provoke economic actions from honest indexers", slashed one of five disputes and drew the rest. Investigation by 86b; ruling posted by ari.
- **Dispute #3** (Minatofund), cited in the thread: self-published subgraphs rigged to fail once another indexer joined, then unsignalled. Slashed.

What weighed in GDR-15: the signal came from the indexer's own address on a subgraph with no real use, it stayed only while the yield suited the indexer, and it moved when others allocated. Signalling alone, on a subgraph people use, was not the finding.

The ruling is a precedent, not a rule. Each case is judged by the Council, and the Horizon-era Council may weigh it differently.

## How to check

- Testnets earn rewards: `issuanceRewards: true` for `sepolia`, `base-sepolia` and `arbitrum-sepolia` in the networks registry (v0.8.7). So signal on a quiet testnet deployment is a real reward pool.
- Who signals: the curation events for the deployment (Explorer, or `Signalled`/`Burned` logs on chain) against the indexer's own and linked addresses.
- Who allocates and when: allocation open and close times against signal changes.
- Filing: a dispute on chain, then a forum post with evidence; the operator must be notified on the forum.

## May have changed

A new Arbitration Charter, a Council ruling on a newer self-signal case, or rewards removed from testnets.
