# #9 Graph Explorer search returns no results

**Status:** closed (fixed, handed-off) · **Area:** studio · **Owner:** foundation · **Last checked:** 2026-10-05

**Asked as:** "Explorer search returns no results", "No results found on thegraph.com/explorer", "my subgraph disappeared from Explorer", "was my subgraph removed from the network", "searching uniswap returns nothing".

## Answer
Explorer's text search was broken: `GET https://thegraph.com/explorer/api/subgraphs/search?...&search=<term>` returned HTTP 200 with `{"lastPage": bool, "subgraphs": []}` for most names (e.g. `uniswap`, exact display names) while the data was in the corpus (`e` returned `uniswap-v4-polygon`). Search by subgraph ID or `Qm...` deployment ID worked throughout. An empty search result does not mean the subgraph was removed. It worked again when checked on 2026-10-05; no root cause was ever published. Workaround if it recurs: search by ID, use Lodestar, or query the network subgraph directly.

## How to check
- `curl 'https://thegraph.com/explorer/api/subgraphs/search?orderBy=Query+Count&orderDirection=desc&chain=arbitrum-one&search=uniswap&page=1'` and count `subgraphs`; zero for `uniswap` means it is broken again.

## Facts worth keeping
- Broken from at least 2026-08-11 to 2026-08-13 (reproduced); fixed by 2026-10-05: `uniswap` 573 results, `aerodrome` 31, `squadswap` 8, `uniswap-v2-ethereum` 1.
- Observed while broken: case-insensitive, matched descriptions too, results collapsed as the term lengthened (`u` 6, `un` 1, `uni` 0).
- Lodestar: https://www.lodestar-dashboard.com

## May have changed
Explorer moved to the Foundation and Graph services were stood down 2026-10-13; the endpoint may be gone entirely.
