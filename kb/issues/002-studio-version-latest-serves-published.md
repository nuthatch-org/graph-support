# #2 Studio /version/latest serves the published version, not the newest deployment

**Status:** closed (root-cause-found) · **Area:** studio, docs · **Owner:** edge-and-node · **Last checked:** 2026-08-11

**Asked as:** "/version/latest still serves the old version", "deployed a new version to Studio but the query URL returns the old one", "playground shows v3.0.0 but the endpoint serves v2.1.0", "api.studio.thegraph.com/query/<id>/<name>/version/latest not updating".

## Answer
`latest` does not mean the most recently deployed version; observed behaviour is consistent with it resolving to the newest published, synced version (inferred from behaviour and docs wording, Studio routing is closed source). Fix: pin the explicit version label and drop `version/` from the path: `https://api.studio.thegraph.com/query/<id>/<name>/v3.0.0/`. That worked immediately. Do not use `/version/latest` while developing; the playground reflects what you actually deployed.

## Facts worth keeping
- Docs passage at fault: "The query URL automatically points to the latest synced version of the Subgraph..." does not say an unpublished deployment is excluded. Docs PR to graphprotocol/docs suggested, not made.
- Resolved by Yash (Edge & Node) in The Graph Discord.

## May have changed
Studio ownership moved to the Foundation; the resolution rule for `latest` could change or be documented.
