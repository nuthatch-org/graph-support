# Who owns what

Most unanswered questions in this ecosystem are unanswered because they were asked of
someone who could not have fixed them. This is the routing map.

We will do this routing for you if you open an issue. It is written down so you can skip
the wait when the answer is obvious.

## Only The Graph Foundation can fix these

The Graph Foundation runs Subgraph Studio, the Explorer, the upgrade indexer and the
public gateway at `gateway.thegraph.com`. Until August 2026 these were Edge & Node's, and
the handover is still in progress, so some E&N people still answer in the channels. That
does not change who owns the fix. These are closed systems. No indexer, no community
member and no amount of clever configuration on your side will move them.

| Symptom | Why it is theirs |
| --- | --- |
| `Failed to deploy ... connect ECONNREFUSED 10.x.x.x:8030` | A private `10.x` address is inside their network. Your machine never touched it. |
| Studio slow, timing out, or not loading | Their hosting. |
| Explorer search returning nothing | Their frontend and their search index. |
| A subgraph stuck syncing **on the upgrade indexer specifically** | The upgrade indexer is theirs. |
| The upgrade indexer reporting `health: unhealthy` on your deployment | Only they can rewind or resync it. Ask for it by name: "please rewind the deployment". |
| A contract call reverting **only** on the upgrade indexer, at a block other indexers handled fine | Their archive RPC, not your mapping. But see the last table. |
| `auth error` on a valid, funded API key | Their gateway's auth path. |
| Studio query URL serving the wrong version | Their routing. |

**Where to go:** the `#subgraph-development` and Studio channels in [The Graph
Discord](https://discord.gg/graphprotocol), tagging the Foundation's support handles on duty.
Open an issue here too if you want it tracked and chased rather than forgotten, but be
clear-eyed that we can only apply pressure and publish the outcome. We cannot restart
their graph-node.

## One specific indexer owns these

Symptoms that name an address, or that disagree between operators.

| Symptom | What it means |
| --- | --- |
| `BadResponse(no attestation: indexing_error)` from one address | That operator's copy of the deployment has failed. |
| `Unavailable(too far behind)` from one address | That operator is behind or stalled. |
| One indexer returns `[]` while others return rows | Divergence. Their database is wrong and they do not know it. |
| `Unavailable(no status: indexer not available)` | Their indexer-service is down. |
| Head queries fine, historical queries fail on and off | Somebody is pruning. Check `earliestBlock` on each allocation, not just `synced`. |

**How to find out who:** every allocation on a deployment is public. Look the deployment
ID up on [Lodestar](https://www.lodestar-dashboard.com) to see who is allocated and what
state each of them is in, or query the network subgraph directly.

**Where to go:** the indexer channels in The Graph Discord, or ping the operator by name.
Indexers are, in practice, the fastest responders in this ecosystem. Several of them fix
things within the hour when told. For proving divergence, the
[P2P PoI tool](https://github.com/p2p-org/graphprotocol-public-poi-tool) will tell you the
block at which two indexers stopped agreeing.

## Upstream owns these

Reproducible graph-node behaviour: crashes, wrong results from correct mappings, handler
semantics, store errors.

**Where to go:** [graphprotocol/graph-node](https://github.com/graphprotocol/graph-node)
issues. Bring a minimal manifest and mapping. If you have a deployment ID that reproduces
it on more than one indexer, say so, because that is what distinguishes a graph-node bug
from one operator's bad disk.

Documentation errors go to [graphprotocol/docs](https://github.com/graphprotocol/docs) as
a pull request. Several of the questions that reach us are not bugs at all, they are the
documentation being ambiguous, and a PR fixes it permanently for everyone.

## The chain, not The Graph

RPC endpoints, archive snapshots, missing state, `execution reverted` on calls that should
succeed. These are problems with the chain client under your indexer, and The Graph cannot
fix a snapshot that shipped with holes in it.

**Where to go:** the indexer operator channels, and the relevant chain's own community.
This is folk knowledge held by about a dozen people, most of it never written down, which
is precisely why it is worth filing here as well so the next person finds it.

## Yours

| Symptom | Reality |
| --- | --- |
| `bad query: ...` | The GraphQL does not parse or validate. |
| `unattestable response: ... argument must be between 0 and ...` | Deep `skip` pagination. Move to cursor pagination. |
| `unattestable response: query is too expensive` / `exceeds the limit` | The query is too big or too deep. |
| Data stops at a date, subgraph is at chain head with no errors | The contract stopped emitting. Check the source, not the indexer. |
| A field is `null` that should have been fetched from IPFS | graph-node tried once at index time and wrote `null`. It does not retry. Only a redeploy re-attempts. Fetch it client-side instead. |
| Studio `/latest` not serving your newest deployment | `/latest` does not mean "most recently deployed". Address the version label explicitly. |
| `Mapping aborted ... Call reverted, ... consider using try_<method>` | A bare contract call in a handler. One operator's RPC answering differently is enough to abort it. `try_` returns a reverted result instead of killing the handler. |
| More signal will fix my query reliability | It will not. Signal attracts allocations. It does not sync a lagging indexer, unprune a pruned one, or change how the gateway picks. |

None of these are anyone else's to fix, but all of them are worth asking about, because
every one of them has caught somebody who then waited days for help that was never coming.

## When you genuinely cannot tell

Open an issue. Working out which of these boxes you are in is the job.

If you would rather ask a person than fill in a form, the
[Nuthatch Discord](https://discord.gg/p9Xc45txWa) is where the people who do this
routing actually sit. Indexers, subgraph developers and delegators in one room, and
somebody in there has usually hit your problem before.
