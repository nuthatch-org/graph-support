# REO eligibility: which oracle, what stake, and indexers answering nothing

**Last checked:** 2026-11-24

**Asked as:** "Am I eligible?", "how many subgraphs do I need?", "my indexer gets queries but earns nothing since September".

## Answer
The oracle that counts is whichever one RewardsManager names: `getProviderEligibilityOracle()` on `0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525` (Arbitrum One) returned `0x02753bae61c08abd4351bce7f48524935c2cc78e` on 2026-11-24. `0x8ec2767a9d9ba02b4e09e8ff4fac2e14a340f304` is retired: last update 2026-07-01, answers `true` for everyone. Lodestar read the retired one until 2026-11-24 and showed 53 of its top 100 indexers as eligible when the live oracle said not (229.5M GRT of delegation behind them).

Required qualifying subgraphs per active day: 1 from 25 Aug, 5 from 6 Oct, 10 from 27 Oct, then the greater of 10 and stake / 4M GRT (rounded up) from 17 Nov. From 8 Dec, stake / 3M GRT (announced at Office Hours #285, not yet in ELIGIBILITY_CRITERIA.md). Then 1 per 2M and 1 per 1M are projected for Jan to Mar 2027, with no dates set. Served, not synced, counts.

Stake as the oracle reads it is the SubgraphService provision less thawing, plus delegation less thawing, with delegation capped at 16x the provision: `getTokensAvailable(indexer, 0xb2bb92d0de618878e438b55d5846cfecd9301105, 16)` on HorizonStaking. The Step 4 forum thread (7133) says self-stake plus all delegation, which overcounts.

An indexer that receives gateway queries but returns zero HTTP 200s is not the tap-agent sender-deny case (#44), because there the gateway stops routing. If the gateway keeps routing and indexer-service refuses, check that the network/escrow subgraphs indexer-service reads are at head (#43), and that the signer resolves to a sender (#36). On 23 Nov 2026, three indexers got 1.4k to 362k queries each and answered none; two had been at zero since about 24 Sep, the TAP sender rotation.

## How to check
- `cast call 0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525 "getProviderEligibilityOracle()(address)"`, then `isEligible(address)(bool)` and `getEligibilityRenewalTime(address)(uint256)` on that address. Renewal + 14 days is expiry.
- QoS nest: `select indexer, count(distinct deployment), sum(query_count), sum(num_200) from qos_indexer_attempt where day='YYYY-MM-DD' group by indexer`. One day per query, or it exceeds the 29 s budget. The rows are five-minute buckets, so a qualifying count from them is a ceiling: no per-query latency or freshness.

## Facts worth keeping
- 2026-11-24: 47 of the 100 indexers in Lodestar's list eligible on the live oracle, holding 862.1M GRT delegated; 53 ineligible, holding 229.5M. One with 137.1M delegated lapsed on 1 Nov (last renewed 18 Oct).
- The oracle runs daily at 10:00 UTC. Renewals are visible as timestamps ending :00 at 10:00 UTC.

## May have changed
The oracle address (resolve it through RewardsManager every time), the step schedule (Step 5 not yet in the criteria document), and the signal floor: the 500 GRT floor in the 22 Sep announcement was not applied in the oracle query as of #46.
