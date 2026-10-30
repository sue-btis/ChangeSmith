# Repository Analysis

The goal of this phase is an **inventory of external destinations** and a correct understanding of what each component is. Everything else in the diagram derives from it.

## Reading Order

Each step narrows the next.

**1. The shape of the repository.** `ls` at the root. One project or several? A monorepo, or sibling folders that are independent repositories? A `.git` per folder means separate repositories, and separate pipelines.

**2. The manifests.** They give the stack, the runtime version and, most valuable, **the dependencies, which reveal external services**. A Redis client package in the manifest means there is a Redis, even if the configuration does not mention it.

| Stack | File |
|---|---|
| .NET | `*.csproj`, `*.fsproj`, `Directory.Packages.props` |
| Node / frontend | `package.json` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile` |
| Java | `pom.xml`, `build.gradle` |
| Go | `go.mod` |
| PHP | `composer.json` |
| Ruby | `Gemfile` |

**3. The configuration.** The destination inventory lives here.

`appsettings*.json` · `.env*` · `application*.yml` · `config/*.js` · `settings.py` · `environment*.ts` · `*.tfvars` · `docker-compose.yml`

Write down literally every value that points outside the process: connection strings, hostnames, IPs, ports, base URLs, container and queue names, credentials.

**4. The entry point.** `Program.cs`, `Startup.cs`, `main.ts`, `index.js`, `app.py`, `main.go`. Startup service registration maps everything the process needs, and reveals what the configuration does not say: authentication middleware, CORS policy, registered clients, health checks, telemetry.

**5. Packaging and deployment.** `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `azure-pipelines.yml`, `.gitlab-ci.yml`, `infra/`, `*.bicep`, `*.tf`. No `Dockerfile` when the target is containers is a pending item to report.

**6. Existing documentation.** `README`, `docs/`, `*.md`. Useful, but treat it as a hypothesis: documentation ages and code does not lie. When they contradict, the code wins, and the contradiction is a finding.

## What Each Signal Means

### The component is not what it seems

The most expensive error, because it invalidates the whole topology and does not show until deployment.

**Microfrontend instead of a standalone application.** Look for `federation.config.js`, `webpack.config.js` with `ModuleFederationPlugin`, `@angular-architects/native-federation`, `single-spa`, or an `exposes` in any manifest. A project that **exposes** modules is a remote: it is mounted inside another application and the user never opens its URL. The diagram must show that:

- the real entry is the host application, not this project;
- the hosting serves static files only, and needs CORS headers so the host can download them;
- the code runs on the **host's origin**: relative paths and browser storage resolve against that domain. Any built-in proxy of the static hosting is useless.

**Worker or job instead of a web service.** No controllers or routes, with a loop or a queue consumer. It has no ingress or domain; it has a trigger and scaling.

**Several services in one project.** More than one entry point, or a `docker-compose` with several services.

### Destinations that live in no cloud

Flag any literal IP or hostname that does not resolve to a managed service. Private ranges:

```
10.0.0.0/8        10.x.x.x
172.16.0.0/12     172.16.x.x  to  172.31.x.x     ← only up to 31
192.168.0.0/16    192.168.x.x
```

Outside those ranges the address is public space, even if the organization uses it internally. The cloud will route it to the internet instead of the tunnel, so the prefix must be declared explicitly in the network configuration.

Either way hybrid connectivity is needed, and the virtual network range cannot overlap the internal network. That range cannot change after creation, so the question comes **before** deployment.

### In-memory state that blocks horizontal scaling

The finding that most often changes a budget, and the only one here that **does not show in configuration**: you have to read the code.

If the process keeps state in its own memory, running more than one replica breaks it: the client sticks to one replica and what happens on the others never reaches it. The symptom is intermittent and nearly impossible to diagnose, because nothing fails; sometimes nothing happens.

| Pattern | Signals |
|---|---|
| SSE or WebSocket connections | `text/event-stream`, `res.write('data:`, a module-scope array or `Map` of clients, `socket.io` without an external adapter |
| In-memory sessions | `express-session` without `store`, in-process session, `IMemoryCache` used as session |
| In-process cache | `node-cache`, a module `Map`, `IMemoryCache`, `@lru_cache` over shared data |
| Local disk files | `multer` with `diskStorage`, writes to relative paths, `/tmp` as storage |
| In-process scheduled tasks | `setInterval`, `node-cron`, `IHostedService` with a timer, `BackgroundService` |
| Counters and limits | In-memory rate limiting, semaphores, lock flags |

What the diagram must show:

- **The service is pinned to one replica** (`minReplicas = maxReplicas = 1`), which also makes it a single point of failure, and every restart drops open connections.
- **The "scalable" tier of any budget stops being valid.** Paying for several replicas of something that cannot run on several is wasted money and an unkept promise.
- The alternative (moving state to Redis, a pub/sub service or object storage) is code work to budget separately.

Say it as the whole chain: *state lives in memory, so one replica, so this budget tier does not apply without code changes*. Each link alone sounds like a technical detail; the chain is a business decision.

### Build-time configuration

A frontend usually resolves the backend URL at build time, not at startup: `environment.prod.ts`, a `.env` consumed by the bundler, an `app-config.js` generated during the build.

So **changing the API URL means rebuilding and redeploying the frontend**. In the diagram the CI/CD arrow to the frontend carries a dependency: the backend's domain must exist before the frontend builds, which orders the deployment.

### Committed secrets

Search the committed configuration files:

```bash
grep -rniE '(password|pwd|secret|apikey|api_key|accountkey|token|connectionstring)\s*[=:]' \
  --include='*.json' --include='*.yml' --include='*.yaml' \
  --include='*.config' --include='*.ts' --include='*.py' .
```

Real values are in git history. Deleting them from the file is not enough: **rotate the credential**. Say it plainly, as an operational fact.

### What the description claims and the code does not do

Compare what you were told with what the entry point registers:

| Claim | What to look for | If missing |
|---|---|---|
| Telemetry / APM | SDK or OpenTelemetry package in the manifest | Only platform logs arrive, no application logs |
| Authentication | `AddAuthentication`, auth middleware, guards | The service is open |
| Multi-tenant | Where the tenant identifier comes from | Tenants may leak into each other |
| Cache | A registered client | Declared but unused |

Always check in multi-tenant systems **where the identifier comes from and what happens when it is missing**. A silent default turns an unauthenticated request into one against a real tenant. Check that the header name matches between sender and reader; a mismatch makes everything fall back to the default with no visible error.

### Configuration that does not survive deployment

- `localhost` URLs or development IPs in client code.
- Fixed development ports.
- Wildcard allowed origins. Allowing any origin is also incompatible with sending credentials: the browser rejects it.
- Forced HTTPS redirection behind a load balancer that already terminates TLS, without processing forwarded headers. It causes redirect loops.
- Certificate validation disabled in connection strings.

## The Inventory

Close the phase with a table. It is what checks the diagram afterwards.

| Destination | Where it appears | Protocol / port | Type | Reachable from |
|---|---|---|---|---|
| `sql-x.database.windows.net` | `appsettings.json` | TDS 1433 | Managed database | Private network |
| `10.4.2.15` | `appsettings.json` | TDS 1433 | Internal server | **Needs a tunnel** |
| `cache.example.com` | `appsettings.json` | Redis 6379 | Cache | Internet |

The last column orders the zones of the diagram.

## What to Ask and What Not

At the end of this phase you know what the system does. What is still missing is what only the team knows: names of existing resources, region, who owns the internal network, what is shared between environments and what was decided for cost.

Asking something that was in the `README` costs credibility exactly when you need it for the findings to be believed.
