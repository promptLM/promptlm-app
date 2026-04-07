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

set -e
echo "Normal build"
# Load env vars if present; fall back to .env.example when available.
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env.example"
fi

if [ -f "$ENV_FILE" ]; then
  if [ "$ENV_FILE" = ".env.example" ]; then
    echo ".env not found, using .env.example"
  fi
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "No .env or .env.example found; continuing without env overrides."
fi

mvn clean install
