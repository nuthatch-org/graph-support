# #22 New Studio API key returns "API key not found" for minutes

**Status:** closed (root-cause-found, reference) · **Area:** area/studio, area/gateway · **Owner:** owner/edge-and-node · **Last checked:** 2026-09-08

**Asked as:** `{"errors":[{"message":"auth error: API key not found"}]}`, "auth error: API key not found", "new API key not working", "how long until a Studio API key works", "wait an hour for API key to propagate", "regenerated key still not found", "malformed API key", "API key error returns 200".

## Answer
The gateway checks the key against an in-memory map per replica, fed by Studio (30 s polling or a Kafka event stream); neither source explains an hour. In one measured trial a fresh key went live 9m20s after first probe, flipping from failure to success inside a single 21 s window (n=1). Wait about ten minutes and do nothing else: regenerating emits a new rotation event, restarts the wait and invalidates the key that was about to work. To rotate without downtime, mint a second key, poll until it answers, switch over, then delete the old one. Whether the delay is Studio producer lag or a stale gateway replica is unresolved. Also check case: an uppercased copy of a valid key passes format checks and then fails as `API key not found`.

## How to check
- Probe loop every 15-20 s with `{_meta{block{number}}}` against `https://gateway.thegraph.com/api/subgraphs/id/<SUB>` using `Authorization: Bearer $KEY`; note the flip time.
- Which origin serves you, no key needed: POST to `https://gateway.thegraph.com/api/x402/subgraphs/id/<SUBGRAPH_ID>`, base64-decode the `payment-required` header, read `.resource.url`.
- Source: `edgeandnode/gateway` `src/auth.rs:89` (lookup), `src/auth.rs:113` (`parse_api_key`, case-insensitive hex), `src/auth/studio_api.rs:20`, `src/auth/kafka.rs` (v27.7.1, commit `1a4aa86`).

## Facts worth keeping
- Auth failures return HTTP 200 on both `gateway.thegraph.com` and `gateway-arbitrum.network.thegraph.com`; edgeandnode/gateway#965 (asking for 401) closed as expected GraphQL behaviour. Clients checking `response.ok` read a dead key as success.
- `DEADBEEF…` (32 hex chars) -> `API key not found`; `notavalidkey` -> `malformed API key`.
- Both gateway hostnames resolve to the same origin; one client was pinned to `mainnet-thegraph-arbitrum-02-eu-west3.thegraph.com`.
- Reported by James | BuildersDAO; escalated by Graphtronauts.

## May have changed
Gateway or Studio key propagation changes; Studio/gateway ownership moved to the Foundation.
