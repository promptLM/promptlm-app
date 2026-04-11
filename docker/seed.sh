#!/bin/bash

# Copyright 2025 promptLM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${SCRIPT_DIR}"

GITEA_URL="http://localhost:3003"
GITEA_API_URL="${GITEA_URL}/api/v1"
GITEA_USERNAME="testuser"
GITEA_PASSWORD="testpass123"
GITEA_EMAIL="test@example.com"
ARTIFACTORY_URL="http://localhost:8092/artifactory"
ARTIFACTORY_REPOSITORY="example-repo-local"
RUNNER_NAME="promptlm-actions-runner"

GITEA_VOLUME_DIR="${SCRIPT_DIR}/data/gitea"
GITEA_APP_DIR="${GITEA_VOLUME_DIR}/gitea"
GITEA_CONFIG_DIR="${GITEA_APP_DIR}/conf"
ARTIFACTORY_BOOTSTRAP_DIR="${SCRIPT_DIR}/data/artifactory/bootstrap"
ARTIFACTORY_SECURITY_DIR="${ARTIFACTORY_BOOTSTRAP_DIR}/security"
ARTIFACTORY_MASTER_KEY_FILE="${ARTIFACTORY_SECURITY_DIR}/master.key"
ARTIFACTORY_SYSTEM_TEMPLATE_FILE="${SCRIPT_DIR}/artifactory.system.yaml"
ARTIFACTORY_SYSTEM_FILE="${ARTIFACTORY_BOOTSTRAP_DIR}/system.yaml"
RUNNER_DATA_DIR="${SCRIPT_DIR}/data/runner"
RUNNER_REGISTRATION_TOKEN_FILE="${RUNNER_DATA_DIR}/registration-token"
TOKEN_FILE="${GITEA_APP_DIR}/admin-token"
GITEA_CONFIG_FILE="/data/gitea/conf/app.ini"

usage() {
  cat <<'EOF'
Usage: ./seed.sh [--fresh]

  --fresh   Remove existing docker data first, then reseed everything.
EOF
}

write_gitea_config() {
  mkdir -p "${GITEA_CONFIG_DIR}" "${GITEA_VOLUME_DIR}/git/lfs"
  cat >"${GITEA_CONFIG_DIR}/app.ini" <<'EOF'
APP_NAME = Gitea: Git with a cup of tea
RUN_MODE = prod
WORK_PATH = /data/gitea

[repository]
ROOT = /data/git/repositories

[repository.local]
LOCAL_COPY_PATH = /data/gitea/tmp/local-repo

[repository.upload]
TEMP_PATH = /data/gitea/uploads

[server]
APP_DATA_PATH = /data/gitea
DOMAIN = localhost
SSH_DOMAIN = localhost
HTTP_PORT = 3000
ROOT_URL = http://localhost:3003/
DISABLE_SSH = false
SSH_PORT = 22
SSH_LISTEN_PORT = 22
LFS_START_SERVER = false

[database]
PATH = /data/gitea/gitea.db
DB_TYPE = sqlite3
HOST = localhost:3306
NAME = gitea
USER = root
PASSWD =
LOG_SQL = false

[indexer]
ISSUE_INDEXER_PATH = /data/gitea/indexers/issues.bleve

[session]
PROVIDER_CONFIG = /data/gitea/sessions

[picture]
AVATAR_UPLOAD_PATH = /data/gitea/avatars
REPOSITORY_AVATAR_UPLOAD_PATH = /data/gitea/repo-avatars

[attachment]
PATH = /data/gitea/attachments

[log]
MODE = console
LEVEL = info
ROOT_PATH = /data/gitea/log

[security]
INSTALL_LOCK = true
SECRET_KEY = Z5J7FJnWBtGfFFHDpc8TQccUmwmZXvGoYOQpgQoN0urosqBOkeLaCPox1y1zbeoU
REVERSE_PROXY_LIMIT = 1
REVERSE_PROXY_TRUSTED_PROXIES = *
INTERNAL_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NTk5OTkwNzB9.db-S0PXNysfuD-zqYvwg_01y007UeGOWlHujp0fnLZw

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false

[actions]
ENABLED = true
DEFAULT_ACTIONS_URL = github
DEFAULT_ACTIONS_URL_GITHUB = https://github.com

[lfs]
PATH = /data/git/lfs

[oauth2]
JWT_SECRET = Idk9VtPIJBCu0J-Hg5Sf-BxG6UJliTQnc_-6UqY4gXk
EOF
}

wait_for_gitea() {
  echo "Waiting for Gitea..."
  for _ in $(seq 1 60); do
    if curl -fsS "${GITEA_API_URL}/version" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "Gitea did not become ready in time." >&2
  return 1
}

wait_for_artifactory() {
  echo "Waiting for Artifactory..."
  for _ in $(seq 1 100); do
    if curl -fsS -u "admin:password" "${ARTIFACTORY_URL}/api/system/ping" >/dev/null 2>&1; then
      return 0
    fi

    local status
    status="$(docker inspect --format '{{.State.Status}}' promptlm-artifactory 2>/dev/null || true)"
    if [ "${status}" = "restarting" ] || [ "${status}" = "exited" ]; then
      echo "Artifactory failed to start cleanly. Recent logs:" >&2
      docker logs --tail 40 promptlm-artifactory >&2 || true
      echo "Artifactory usually fails here because Docker Desktop is short on disk or the Artifactory volume needs a clean reset. Free Docker disk space, then retry or run ./seed.sh --fresh." >&2
      return 1
    fi

    sleep 3
  done

  echo "Artifactory did not become ready in time." >&2
  return 1
}

wait_for_runner_registration() {
  echo "Waiting for Gitea runner registration..."
  for _ in $(seq 1 60); do
    if [ -f "${RUNNER_DATA_DIR}/.runner" ]; then
      rm -f "${RUNNER_REGISTRATION_TOKEN_FILE}"
      return 0
    fi
    sleep 2
  done

  echo "Gitea runner did not register in time." >&2
  docker logs --tail 40 promptlm-gitea-runner >&2 || true
  return 1
}

ensure_artifactory_bootstrap_files() {
  mkdir -p "${ARTIFACTORY_SECURITY_DIR}"

  if [ -e "${ARTIFACTORY_SYSTEM_FILE}" ] && [ ! -f "${ARTIFACTORY_SYSTEM_FILE}" ]; then
    echo "Removing stale Artifactory bootstrap path at ${ARTIFACTORY_SYSTEM_FILE}" >&2
    rm -rf "${ARTIFACTORY_SYSTEM_FILE}"
  fi

  if [ -e "${ARTIFACTORY_MASTER_KEY_FILE}" ] && [ ! -f "${ARTIFACTORY_MASTER_KEY_FILE}" ]; then
    echo "Removing stale Artifactory master key path at ${ARTIFACTORY_MASTER_KEY_FILE}" >&2
    rm -rf "${ARTIFACTORY_MASTER_KEY_FILE}"
  fi

  if [ ! -f "${ARTIFACTORY_SYSTEM_FILE}" ]; then
    cp "${ARTIFACTORY_SYSTEM_TEMPLATE_FILE}" "${ARTIFACTORY_SYSTEM_FILE}"
  fi

  if [ -s "${ARTIFACTORY_MASTER_KEY_FILE}" ]; then
    return 0
  fi

  umask 077
  od -An -tx1 -N32 /dev/urandom | tr -d ' \n' >"${ARTIFACTORY_MASTER_KEY_FILE}"
}

ensure_gitea_user() {
  docker exec -u git promptlm-gitea gitea --config "${GITEA_CONFIG_FILE}" admin user create \
    --username "${GITEA_USERNAME}" \
    --password "${GITEA_PASSWORD}" \
    --email "${GITEA_EMAIL}" \
    --admin >/dev/null 2>&1 || true
}

ensure_gitea_token() {
  if [ -s "${TOKEN_FILE}" ] && curl -fsS -H "Authorization: token $(cat "${TOKEN_FILE}")" \
    "${GITEA_API_URL}/user" >/dev/null 2>&1; then
    return 0
  fi

  local fixed_token="eaff22ec6c62d833faffb43aba86836856c7e3fd"
  local token_hash
  token_hash=$(echo -n "${fixed_token}" | sha256sum | cut -d' ' -f1)
  local uid=1  # admin user

  mkdir -p "$(dirname "${TOKEN_FILE}")"

  # Insert or update the fixed token directly in Gitea's database
  docker exec -u git promptlm-gitea sqlite3 /data/gitea/gitea.db <<EOF
INSERT OR REPLACE INTO access_token (uid, name, token_hash, token_salt, token_last_eight, scope, created_unix, updated_unix)
VALUES (
  ${uid},
  'promptlm-dev-token',
  '${token_hash}',
  '',
  substr('${fixed_token}', -8),
  'write:repository,read:user,write:user,read:admin,write:admin',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
EOF

  echo -n "${fixed_token}" >"${TOKEN_FILE}"
}

start_or_register_runner() {
  if [ -f "${RUNNER_DATA_DIR}/.runner" ]; then
    rm -f "${RUNNER_REGISTRATION_TOKEN_FILE}"
    docker compose up -d gitea-runner >/dev/null
    return 0
  fi

  local runner_token
  runner_token="$(docker exec -u git promptlm-gitea gitea --config "${GITEA_CONFIG_FILE}" actions generate-runner-token | tr -d '\r' | grep -Eo '[A-Za-z0-9]{40}' | head -n 1)"
  if [ -z "${runner_token}" ]; then
    echo "Failed to generate a Gitea runner registration token." >&2
    return 1
  fi

  umask 077
  printf '%s' "${runner_token}" >"${RUNNER_REGISTRATION_TOKEN_FILE}"
  docker compose up -d gitea-runner >/dev/null
  docker compose restart gitea-runner >/dev/null
  wait_for_runner_registration
}

ensure_runner_node() {
  docker exec -u root promptlm-gitea-runner sh -lc '
    set -euo pipefail
    if command -v node >/dev/null 2>&1; then
      exit 0
    fi

    if command -v apk >/dev/null 2>&1; then
      apk update
      apk add --no-cache nodejs npm sudo
      exit 0
    fi

    if command -v apt-get >/dev/null 2>&1; then
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y curl ca-certificates gnupg sudo
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
      exit 0
    fi

    echo "Unsupported act_runner base image: no apk or apt-get available" >&2
    exit 1
  '
}

fresh=0
if [ "${1:-}" = "--fresh" ]; then
  fresh=1
elif [ $# -gt 0 ]; then
  usage >&2
  exit 1
fi

if [ "${fresh}" -eq 1 ]; then
  echo "Removing existing Docker data..."
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "${SCRIPT_DIR}/data"
fi

write_gitea_config
ensure_artifactory_bootstrap_files
mkdir -p "${RUNNER_DATA_DIR}"

echo "Starting Gitea and Artifactory..."
docker compose up -d gitea artifactory >/dev/null
docker compose restart gitea >/dev/null

wait_for_gitea
ensure_gitea_user
ensure_gitea_token
start_or_register_runner
ensure_runner_node
wait_for_artifactory

echo
echo "Docker development stack is ready."
echo "Gitea UI: ${GITEA_URL}"
echo "Gitea API: ${GITEA_API_URL}"
echo "Gitea credentials: ${GITEA_USERNAME} / ${GITEA_PASSWORD}"
echo "Gitea token: $(cat "${TOKEN_FILE}")"
echo "Artifactory URL: ${ARTIFACTORY_URL}"
echo "Artifactory credentials: admin / password"
echo "Artifactory repository: ${ARTIFACTORY_REPOSITORY}"
echo "Runner network URL: http://artifactory:8081/artifactory/${ARTIFACTORY_REPOSITORY}"
echo
echo "Normal lifecycle:"
echo "  docker compose up -d"
echo "  docker compose down"
