# #23 GIP-0089 Innovation Allocation: 20% of issuance to the Foundation

**Status:** open (status/triage, reference, seed) · **Area:** area/governance · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "GIP-0089", "Innovation Allocation", "20% of issuance to the Foundation", "how much will indexing rewards drop", "does REO redistribute rewards to eligible indexers", "where do denied rewards go", "reclaim address", "revertOnIneligible", "Issuance Allocator", "120.73 GRT per block", "Rewards Eligibility Oracle".

## Answer
GIP-0089 splits the unchanged 120.73 GRT/block issuance: 96.584 (80%) to the Rewards Manager, 24.146 (20%) to a Foundation DirectAllocation, permanently with no sunset; after GIP-0088 Phase 3 the Rewards Manager drops to 90.584 (75%), with 6 GRT going to the Recurring Agreement Manager (DIPS). It activated on chain by 2026-10-05 (exact block not established). From the contract: denying an ineligible indexer redistributes nothing; eligible indexers gain only when ineligible stake exits a deployment (rewards are divided by `subgraphAllocatedTokens`), so the cut is immediate and the recovery delayed, partial and unmodelled. As configured on 2026-10-08, `revertOnIneligible = true`, so ineligibility defers rewards (claimable if the indexer becomes eligible before the allocation goes stale) rather than dropping or redirecting them; reclaims under conditions without their own address mint to the ReclaimedRewards default address. The status block and on-chain section in the issue body describe 2026-08-20 and are out of date.

## How to check
On Arbitrum One Rewards Manager `0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525`:
```
cast call <RM> "getIssuanceAllocator()(address)"
cast call <RM> "getRevertOnIneligible()(bool)"
cast call <RM> "getDefaultReclaimAddress()(address)"
cast call <RM> "getReclaimAddress(bytes32)(address)" $(cast keccak "INDEXER_INELIGIBLE")
cast call <RM> "issuancePerBlock()(uint256)"
```
Issuance Allocator `0xb64f29b2d81140ffc3a135e319561a1bd03b1a7e`: `getTargetCount()`, `getTargetAt(uint256)`. L2GraphToken `0x9623063377AD1B27544C965cCd7342f7EA7e88C7` `isMinter(address)`. Watch `RewardsReclaimed` and `RewardsDeniedDueToEligibility` events. Source: `RewardsManager.sol`, `RewardsCondition.sol` in graphprotocol/contracts.

## Facts worth keeping
- 2026-10-05 at Arbitrum block 511869246: allocator targets RewardsManager 96.584, `0x2Ff06bA8086f37BA656a5b75405bF985f738B16e` 24.146, `0x28cd50e9…ddE1E` 0. graph-academy first saw it flowing at block 504192623.
- 2026-10-08 reads: `getProviderEligibilityOracle` `0x02753BaE…c78E` (RewardsEligibilityOracleA), `getRevertOnIneligible` true, `getReclaimAddress(INDEXER_INELIGIBLE)` zero, `getDefaultReclaimAddress` `0xe26cDC4E…bB37` (ReclaimedRewards). Allocator and RM both GraphToken minters. Other condition slots unchecked.
- Eleven reclaim conditions in `RewardsCondition.sol` (`INDEXER_INELIGIBLE`, `SUBGRAPH_DENIED`, `STALE_POI`, `ZERO_POI`, `CLOSE_ALLOCATION`, etc.); keccak hashes listed in the issue.
- GIP's offset claim: in 2025, 15.2% of indexing rewards went to indexers providing effectively no value plus 11.8% to low-uptime or under-20-subgraph indexers.
- ~63.0M GRT/year to the allocation on 2,610,162 blocks/year.
- Foundation: Council has 7 voting seats, 3 held by indexers (Ellipfra, Data Nexus, GraphOps); line-item budget declined. Whether the 6-of-10 multisig threshold still applies is unanswered.
- GIP-0070's Indexer Income Target / GIP-0075 taper remain undrafted.
- REO stricter criteria from 6 October: see #46.

## May have changed
Governance can change reclaim addresses, `revertOnIneligible` or the split at any time; re-read the getters.
