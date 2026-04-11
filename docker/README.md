# Docker Dev Stack

Minimal local infrastructure for PromptLM development:

- `gitea`
- `gitea-runner`
- `artifactory`

Everything lives in one Compose stack. The only helper script is `seed.sh`, which prepares Gitea, registers the Actions runner, and waits for Artifactory.

## First-time setup

```bash
cd docker
./seed.sh
```

That will:

- create the local Gitea and runner data directories
- generate a local Artifactory master key under `docker/data/artifactory/bootstrap/security/master.key`
- generate an Artifactory bootstrap config at `docker/data/artifactory/bootstrap/system.yaml`
- write the Gitea and runner config files
- start Gitea and Artifactory
- create the `testuser` admin account with a fixed API token
- register the Gitea Actions runner

## Day-to-day usage

```bash
cd docker
docker compose up -d
docker compose down
```

If you start the stack before running `seed.sh`, the runner container will stay idle until it has either a saved registration in `docker/data/runner/.runner` or a registration token from `seed.sh`.
`seed.sh` now drops that registration token into `docker/data/runner/registration-token`, so an already-running runner container can pick it up without being recreated.

## Reset everything

```bash
cd docker
./seed.sh --fresh
```

## Access

- Gitea UI: `http://localhost:3003`
- Gitea API: `http://localhost:3003/api/v1`
- Gitea credentials: `testuser / testpass123`
- Gitea API token: `eaff22ec6c62d833faffb43aba86836856c7e3fd` (stable, matches `.env.example`)
- Artifactory: `http://localhost:8092/artifactory`
- Artifactory credentials: `admin / password`
- Host Maven URL: `http://localhost:8092/artifactory/example-repo-local`
- Runner Maven URL: `http://artifactory:8081/artifactory/example-repo-local`

The Gitea API token is stored in `docker/data/gitea/gitea/admin-token` (value is stable across re-runs).

Artifactory now uses a Docker named volume instead of a host bind mount. That avoids the startup latency issues Docker Desktop can hit with Artifactory's embedded Derby database on macOS.
The seed script also generates a local dev `master.key` and bootstrap `system.yaml` outside git so Artifactory does not race its own slow first-boot key generation and can safely rewrite its runtime config.

If you want to wipe Artifactory state too, run `./seed.sh --fresh` or `docker compose down -v`.

For local development, the compose file also disables Artifactory's startup disk-space guard. If Artifactory still behaves badly under disk pressure, the real fix is to free Docker disk space or increase Docker Desktop's disk image size.
