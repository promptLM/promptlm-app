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

if command -v node >/dev/null 2>&1; then
  node --version
  exit 0
fi

find_writable_path_dir() {
  local dir
  IFS=':'
  for dir in $PATH; do
    if [ -n "${dir}" ] && [ -d "${dir}" ] && [ -w "${dir}" ]; then
      echo "${dir}"
      return 0
    fi
  done
  return 1
}

install_with_pkg() {
  if command -v apk >/dev/null 2>&1; then
    if apk update && apk add --no-cache nodejs npm sudo; then
      return 0
    fi
    echo "apk install failed, falling back to tarball install" >&2
  fi

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    if apt-get update && apt-get install -y nodejs npm curl ca-certificates gnupg sudo; then
      return 0
    fi
    echo "apt-get install failed, falling back to tarball install" >&2
  fi

  return 1
}

download_to() {
  local url="$1"
  local out="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "${url}" -o "${out}"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "${out}" "${url}"
  else
    echo "Neither curl nor wget available for Node download" >&2
    exit 1
  fi
}

install_with_tarball() {
  local node_version="%s"
  local node_arch
  case "$(uname -m)" in
    x86_64) node_arch="linux-x64" ;;
    aarch64|arm64) node_arch="linux-arm64" ;;
    *)
      echo "Unsupported architecture for Node install" >&2
      exit 1
      ;;
  esac

  local install_root="/usr/local"
  local install_bin_dir="/usr/local/bin"
  local install_lib_dir="/usr/local/lib/nodejs"
  if [ ! -w "/usr/local" ]; then
    install_root="${HOME:-/tmp}/.local"
    install_bin_dir="${install_root}/bin"
    install_lib_dir="${install_root}/lib/nodejs"
    mkdir -p "${install_bin_dir}" "${install_lib_dir}"
    case ":$PATH:" in
      *:"${install_bin_dir}":*) ;;
      *) export PATH="${install_bin_dir}:${PATH}" ;;
    esac
  else
    mkdir -p "${install_lib_dir}"
  fi

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  download_to "https://nodejs.org/dist/v${node_version}/node-v${node_version}-${node_arch}.tar.xz" "${tmp_dir}/node.tar.xz"
  tar -xJf "${tmp_dir}/node.tar.xz" -C "${install_lib_dir}"
  local node_dir="${install_lib_dir}/node-v${node_version}-${node_arch}"

  ln -sf "${node_dir}/bin/node" "${install_bin_dir}/node"
  ln -sf "${node_dir}/bin/npm" "${install_bin_dir}/npm"
  ln -sf "${node_dir}/bin/npx" "${install_bin_dir}/npx"

  if ! command -v sudo >/dev/null 2>&1; then
    local sudo_target
    sudo_target="$(find_writable_path_dir || true)"
    if [ -z "${sudo_target}" ]; then
      sudo_target="${install_bin_dir}"
      mkdir -p "${sudo_target}"
    fi
    cat > "${sudo_target}/sudo" <<'EOF'
#!/bin/sh
if [ "$1" = "--version" ]; then
  echo "sudo stub 1.0"
  exit 0
fi
exec "$@"
EOF
    chmod +x "${sudo_target}/sudo"
  fi

  rm -rf "${tmp_dir}"
}

if ! install_with_pkg; then
  install_with_tarball
fi

if ! command -v sudo >/dev/null 2>&1; then
  if command -v apk >/dev/null 2>&1; then
    apk add --no-cache sudo || true
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get install -y sudo || true
  fi
fi

node --version
