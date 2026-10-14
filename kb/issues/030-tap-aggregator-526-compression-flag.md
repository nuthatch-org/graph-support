# #30 TAP aggregator Cloudflare 526 shows as "invalid compression flag: 101", then denylisted sender

**Status:** closed (root-cause-found, fixed) · **Area:** area/indexer, area/horizon · **Owner:** owner/foundation · **Last checked:** 2026-10-08

**Asked as:** "Error while requesting RAV for sender", "protocol error: received message with invalid compression flag: 101 (valid flags are 0 and 1) while receiving response with status: 526 <unknown status code>", "code: 'Internal error'", "Received a receipt from a denylisted sender: 0xDDE4cfFd3D9052A9cb618fC05a1Cd02be1f2F467", "Issues with provided receipt", "code: 'Deadline exceeded'", "RAV request deadline exceeded; consider increasing request_timeout_secs", "tap-agent denylisted the gateway", "should I delete the denylist row".

## Answer
On 8 September 2026 the mainnet TAP aggregator `https://tap-aggregator.network.thegraph.com` returned Cloudflare HTTP 526 (origin TLS certificate failed validation). tonic hands a non-gRPC body to the decoder, which reads the first byte as the compression flag: 101 is `e` from `error code: 526`, 60 would be `<` from an HTML page, 123 a `{` JSON body. Every RAV request failed, unaggregated fees climbed past `max_amount_willing_to_lose_grt` (default 20 GRT), and tap-agent wrote the sender into `tap_horizon_denylist`, so indexer-service refused every receipt. Receipts are not lost; the denial lifts automatically after the next successful RAV. Ignore the flag number and read the HTTP status at the end of the message. Fixed: E&N renewed the certificate the same day, and RAVs for the sender were redeemed on chain later; a denylisted sender after 24 September is more likely the sender rotation in #44.

## How to check
```console
curl -sSI --http2 https://tap-aggregator.network.thegraph.com/ | head -3
curl -sS -X POST --http2 -H "content-type: application/grpc" -H "te: trailers" -H "Accept:" \
  https://tap-aggregator.network.thegraph.com/tap_aggregator.v2.TapAggregator/AggregateReceipts -D -
# healthy: HTTP/2 200, grpc-status: 13, "Missing request message"
curl -sS <endpoint> | xxd   # first byte of the proxy body = the "flag"
psql -c "SELECT * FROM tap_horizon_denylist;"
psql -c "SELECT * FROM scalar_tap_denylist;"   # older releases, legacy TAP
psql -c "SELECT count(*), sum(value) FROM tap_horizon_receipts WHERE signer_address = 'dde4cffd3d9052a9cb618fc05a1cd02be1f2f467';"
```
Prometheus: `tap_sender_denied{sender=...}` goes to 1; `tap_sender_fee_tracker_grt_total` ramps to `tap_max_fee_per_sender_grt_total`.

## Facts worth keeping
- Sender `0xDDE4cfFd3D9052A9cb618fC05a1Cd02be1f2F467` is E&N's mainnet gateway sender; its aggregator URL is the indexer-rs default (`crates/config/default_values.toml`).
- Workaround (Marc-André, Ellipfra): raise `[tap] max_amount_willing_to_lose_grt` or env `TAP_AGENT_TAP__MAX_AMOUNT_WILLING_TO_LOSE_GRT`. Needs a tap-agent restart; it raises what you are willing to lose. The restart does not itself lift the denial.
- Do NOT `DELETE FROM tap_horizon_denylist`; tap-agent warns this risks losing all query fees. Repointing at another aggregator does not work: the RAV signer must map to the sender in escrow.
- RAV trigger = max_amount / `trigger_value_divisor` (20/10 = 2 GRT); retries every 30 s.
- After the cert fix the origin took 14-66 s to answer vs `rav_request.request_timeout_secs` default 5 s, so errors became `Deadline exceeded`; by 5 October it answered in 0.18-0.54 s.
- Closing evidence: GraphTallyCollector redeemed RAVs with payer `0xDDE4...F467` at Arbitrum blocks 512658134 and 512727467.
- Downstream query symptom: #31 (`BadResponse(400)`). Credit: Tehn (report), Juan and Carlos at E&N (cert fix), Marc-André (workaround).

## May have changed
Aggregator ownership moving to the Foundation; sender rotation (#44) changes which sender address to look for.
