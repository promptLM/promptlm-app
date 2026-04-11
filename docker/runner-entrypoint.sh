#!/bin/sh

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

set -eu

CONFIG_FILE="${CONFIG_FILE:-/data/config.yaml}"
RUNNER_STATE_FILE="/data/.runner"
RUNNER_TOKEN_FILE="${GITEA_RUNNER_REGISTRATION_TOKEN_FILE:-/data/registration-token}"

while [ ! -f "${CONFIG_FILE}" ]; do
  echo "Waiting for runner config at ${CONFIG_FILE}..."
  sleep 2
done

while [ ! -f "${RUNNER_STATE_FILE}" ] && [ -z "${GITEA_RUNNER_REGISTRATION_TOKEN:-}" ] && [ ! -s "${RUNNER_TOKEN_FILE}" ]; do
  echo "Runner is waiting for registration state or token at ${RUNNER_TOKEN_FILE}..."
  sleep 5
done

if [ ! -f "${RUNNER_STATE_FILE}" ] && [ -z "${GITEA_RUNNER_REGISTRATION_TOKEN:-}" ] && [ -s "${RUNNER_TOKEN_FILE}" ]; then
  GITEA_RUNNER_REGISTRATION_TOKEN="$(cat "${RUNNER_TOKEN_FILE}")"
  export GITEA_RUNNER_REGISTRATION_TOKEN
  echo "Runner loaded registration token from ${RUNNER_TOKEN_FILE}."
fi

exec /usr/local/bin/run.sh
