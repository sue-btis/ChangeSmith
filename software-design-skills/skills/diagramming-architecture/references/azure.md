# Azure

Naming conventions, constraints that bite at deployment, and what is usually missing. Everything here changes the diagram or the request to infrastructure.

## Names

The pattern that holds is `<abbreviation>-<system>-<environment>`. What matters is not the exact pattern but **following the one the organization already uses**, even when it is not the one you would choose.

| Resource | Abbreviation | Example |
|---|---|---|
| Resource group | `rg-` | `rg-system-prod` |
| Virtual network | `vnet-` | `vnet-system-prod` |
| Container app | `ca-` | `ca-system-api-prod` |
| Container Apps environment | `cae-` | `cae-system-prod` |
| Static Web App | `swa-` | `swa-system-prod` |
| App Service | `app-` | `app-system-prod` |
| SQL logical server | `sql-` | `sql-system-prod` |
| Elastic pool | `ep-` | `ep-system-prod` |
| Key Vault | `kv-` | `kv-system-prod` |
| Application Insights | `appi-` | `appi-system-prod` |
| Log Analytics | `law-` | `law-system-prod` |

Two resources allow no hyphens and go all together in lowercase: **Container Registry** (`acrsystemprod`) and **storage accounts** (`stsystemprod`, 24 characters at most). It is a platform constraint, not a style choice.

## Constraints That Bite

### Container Apps and the virtual network

The subnet is dedicated and **its size cannot change after the environment is created**, so the question comes before deployment.

| Environment type | Minimum subnet | Delegation |
|---|---|---|
| Workload profiles (current) | `/27` | `Microsoft.App/environments` |
| Consumption only (legacy) | `/23` | None |

Only the workload profiles environment supports user-defined routes, NAT gateway egress, private endpoints on the environment, and transit through a remote gateway. Reaching an internal network requires it.

The subnet range **cannot overlap** `169.254.0.0/16`, `172.30.0.0/16`, `172.31.0.0/16` or `192.0.2.0/24`, which Kubernetes reserves underneath. The workload profiles environment also reserves `100.100.0.0/17` and the three `/19` blocks that follow.

Nor can it overlap the internal network it will connect to. Confirm that range before choosing the virtual network's.

### Static Web Apps with a linked backend

Linking a backend sounds convenient and has constraints that rule it out more often than it seems:

- It requires the **Standard** plan.
- The route prefix must be `/api`, and the backend must expose that prefix.
- **45 seconds per request at most.** No WebSockets.
- **Network-isolated backends are not supported.** The container keeps public ingress anyway.
- Linking injects an identity provider into the backend that **only accepts traffic proxied by the Static Web App**. Any client calling the backend directly is rejected.

That last point rules out the link when the frontend is a microfrontend mounted in another application: calls leave from the host's origin and never pass through the proxy. Then the backend gets its own domain and explicit CORS.

### Private endpoints

A private endpoint without its private DNS zone does not resolve, and the symptom is that the name still points at the public address. Each zone must also be **linked to the virtual network**.

| Service | Zone |
|---|---|
| Azure SQL | `privatelink.database.windows.net` |
| Key Vault | `privatelink.vaultcore.azure.net` |
| Blob Storage | `privatelink.blob.core.windows.net` |
| Container Registry | `privatelink.azurecr.io` |

### Creation order

Three traps that cost a full round:

**The Container App needs an image that already exists.** Creating it against an empty registry fails to pull. The usual pattern creates it with a public bootstrap image that the first pipeline replaces.

**The VPN Gateway takes 30 to 45 minutes** to provision. It goes at the start of the script, not the end.

**Role assignments take time to propagate.** Without a wait in between, the next step fails on permissions even though the role is assigned.

### What the command line cannot do

Useful when preparing a request to infrastructure, because it marks who owns what:

- **The local side of the tunnel**: configuring the internal network's router or firewall with the peer address and shared key. Infrastructure does it on their equipment.
- **The Azure DevOps service connection.** The Azure half (app registration and federated credential) can be created, but the connection lives in DevOps, another API.
- **Internal network firewall rules** allowing the port from the virtual network range.

## What Is Usually Missing

Check against the repository; something from this list is almost always missing:

| Missing | How it shows | Consequence |
|---|---|---|
| `Dockerfile` | Not in the repo and the target is containers | Nothing to deploy |
| Telemetry SDK | No Application Insights or OpenTelemetry package | Only platform logs arrive |
| Health endpoint | No health route | Probes cannot tell whether the replica serves |
| Forwarded headers | HTTPS redirection without processing them | Redirect loop behind the ingress |
| CORS origins | Wildcard in the policy | They must be pinned, and the wildcard is incompatible with credentials |

## Cost

When proposing a non-production environment, these three hold the real savings:

- **VPN Gateway** is the expensive component and should not be duplicated per environment. The usual pattern is one in a hub virtual network, peered to each environment.
- **Elastic pool** makes sense when many databases with irregular load share capacity. With two or three, individual databases are cheaper.
- **Log Analytics** can share a workspace between environments, with separate Application Insights resources so metrics do not mix.

## Multi-Tenant With Dynamic Connections

A frequent pattern: each tenant's connection strings live as rows in a central database, not in Key Vault. It works, and it is worth drawing explicitly because it changes what Key Vault means in the diagram: it covers only the bootstrap secret, and a reader must not assume it protects the rest.

Two consequences worth flagging once:

- **Managed identity does not apply** to the per-tenant databases, because the string comes from a row with user and password authentication.
- **Onboarding or offboarding a tenant is a data process**, not configuration. If those rows store literal IP addresses instead of DNS names, any address change means updating rows in the database.
