# Reproducing faults locally

**Last checked:** 2026-09-16. Recipes used to settle #39, #40 and #41.

## A throwaway graph-node


Built for #40 on 2026-09-15 to settle whether an unhealthy deployment can serve attestable responses.
`git worktree add <scratch> v0.45.0` then `cargo build --release --bin graph-node` took 3 minutes
with the workspace deps already cached. Everything native, no Docker.

- **Postgres**: `initdb -U graph --auth=trust -E UTF8 --locale=C`, then start with
  `-c listen_addresses=127.0.0.1 -c unix_socket_directories=''`. The scratchpad path is too long for a
  macOS unix socket and the server exits with "could not create any Unix-domain sockets".
- **graph-node refuses a store URL without a password** even under trust auth: use `graph:graph@`.
- **IPFS**: `brew install kubo`, `IPFS_PATH=<scratch> ipfs init --profile test`, API on a spare port,
  `ipfs daemon --offline`. **Chain**: `anvil --port 18545`, `cast rpc anvil_mine 20`.
- Config needs `[chains] ingestor = "<node-id>"`; env `ETHEREUM_REORG_THRESHOLD=0`.
- A block-handler subgraph with `features: [nonFatalErrors]` and `assert(false)` at block N gives an
  unhealthy deployment in seconds. `curl -si` on `/subgraphs/id/<hash>` shows `graph-attestable`.

Result worth remembering: pinned below the first error block the response is attestable; at or above
it, unpinned, or with `subgraphError: allow`, it is not.


## Mapping traps from the deployed wasm


For #39 (2026-09-14) the subgraph source was not public, so the reproduction was built from the
deployment's mapping wasm itself: `wasm-tools print` to wat, append an exported function that runs
the suspect loop body verbatim against the module's own functions and allocator, `wasm-tools parse`,
then run under wasmtime-py (a venv in the scratchpad) with stub host imports. Model host-returned
objects as graph-node does: 10,000-byte arenas via the `allocate` export, +12 offset, 20-byte header,
content padded to 16 (`raw_new`, `alloc_obj`). wasmtime and V8 agreed to the byte.

`wasm unreachable` with `~lib/rt/stub/__alloc` as frame 0 is wasm memory exhaustion. The stub runtime
never frees within a handler, and its `maxOffset = memory.size << 16` wraps to 0 at 65,536 pages, so
the first allocation after memory reaches 4 GiB traps: the real budget is about 2 GiB.


## Matchstick


Proving a mapping fix for #40 (2026-09-15, Uniswap v4-subgraph), a repo's pinned graph-cli 0.64.1
refused `graph test` with `Unsupported platform: Darwin arm64 25`. The global `/opt/homebrew/bin/graph`
(0.98.1) run from the repo root downloads matchstick 0.6.0 `binary-macos-12-m1` and runs natively, no
Docker. `yarn install --ignore-scripts` then `yarn codegen` first. It takes a file pattern, not a test
name: `graph test` with no argument runs the whole suite.

The pattern that settled it: one git worktree at the deployed commit, one with the fix cherry-picked,
the same test in both, built from the real transaction's event params, with `createMockedFunction(...).reverts()`
for every eth_call the chain reverted. The deployed worktree reproduced the production abort message
byte for byte.

Matchstick 0.6.0 (still the latest, 2023-10) has no `yaml.*` host functions: any mapping module that imports
`yaml.try_fromBytes` fails to instantiate with "unknown import: `yaml::yaml.try_fromBytes`", so a fix built on the
native YAML parser (graph-network-subgraph #335, 2026-09-16) cannot be unit tested there. Reproduce the old parser's
abort in matchstick, and prove the new one on a real graph-node.

