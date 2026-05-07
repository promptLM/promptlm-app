#!/usr/bin/env bash
# Copyright $COPYRIGHT_YEAR $COPYRIGHT_HOLDER
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

set -Eeuo pipefail

AUTO_INSTALL_MISSING_TOOLS="${AUTO_INSTALL_MISSING_TOOLS:-false}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

warn() {
  echo "WARN: $*" >&2
}

info() {
  echo "INFO: $*" >&2
}

require_cmd() {
  local command_name="${1:-}"
  [[ -n "${command_name}" ]] || die "require_cmd needs a command name."
  command -v "${command_name}" >/dev/null 2>&1 || die "Required command not found: ${command_name}"
}

normalize_bool() {
  local value="${1:-false}"
  case "${value}" in
    1|true|TRUE|yes|YES|on|ON) echo "true" ;;
    0|false|FALSE|no|NO|off|OFF) echo "false" ;;
    *) echo "false" ;;
  esac
}

set_auto_install_from_flag() {
  local flag_value="${1:-false}"
  AUTO_INSTALL_MISSING_TOOLS="$(normalize_bool "${flag_value}")"
}

can_run_cmd() {
  local command_name="${1:-}"
  [[ -n "${command_name}" ]] || return 1
  command -v "${command_name}" >/dev/null 2>&1
}

detect_package_manager() {
  if can_run_cmd brew; then
    echo "brew"
    return 0
  fi
  if can_run_cmd apt-get; then
    echo "apt"
    return 0
  fi
  if can_run_cmd dnf; then
    echo "dnf"
    return 0
  fi
  if can_run_cmd yum; then
    echo "yum"
    return 0
  fi
  if can_run_cmd pacman; then
    echo "pacman"
    return 0
  fi
  echo "unknown"
}

package_name_for_command() {
  local command_name="${1:-}"
  case "${command_name}" in
    rg) echo "ripgrep" ;;
    mvn) echo "maven" ;;
    gradle) echo "gradle" ;;
    docker) echo "docker" ;;
    awk) echo "gawk" ;;
    bash) echo "bash" ;;
    *) echo "${command_name}" ;;
  esac
}

install_hint_for_command() {
  local command_name="${1:-}"
  local package_name
  local pkg_mgr

  package_name="$(package_name_for_command "${command_name}")"
  pkg_mgr="$(detect_package_manager)"

  case "${pkg_mgr}" in
    brew) echo "Install with: brew install ${package_name}" ;;
    apt) echo "Install with: sudo apt-get update && sudo apt-get install -y ${package_name}" ;;
    dnf) echo "Install with: sudo dnf install -y ${package_name}" ;;
    yum) echo "Install with: sudo yum install -y ${package_name}" ;;
    pacman) echo "Install with: sudo pacman -S --noconfirm ${package_name}" ;;
    *) echo "Install '${command_name}' with your OS package manager and retry." ;;
  esac
}

run_install_command() {
  local command_name="${1:-}"
  local package_name
  local pkg_mgr

  package_name="$(package_name_for_command "${command_name}")"
  pkg_mgr="$(detect_package_manager)"

  case "${pkg_mgr}" in
    brew)
      brew install "${package_name}"
      ;;
    apt)
      if can_run_cmd sudo; then
        sudo apt-get update
        sudo apt-get install -y "${package_name}"
      elif [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        apt-get update
        apt-get install -y "${package_name}"
      else
        return 1
      fi
      ;;
    dnf)
      if can_run_cmd sudo; then
        sudo dnf install -y "${package_name}"
      elif [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        dnf install -y "${package_name}"
      else
        return 1
      fi
      ;;
    yum)
      if can_run_cmd sudo; then
        sudo yum install -y "${package_name}"
      elif [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        yum install -y "${package_name}"
      else
        return 1
      fi
      ;;
    pacman)
      if can_run_cmd sudo; then
        sudo pacman -S --noconfirm "${package_name}"
      elif [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        pacman -S --noconfirm "${package_name}"
      else
        return 1
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

ensure_cmd() {
  local command_name="${1:-}"
  local purpose="${2:-required step}"
  local hint

  [[ -n "${command_name}" ]] || die "ensure_cmd needs a command name."

  if can_run_cmd "${command_name}"; then
    return 0
  fi

  if [[ "$(normalize_bool "${AUTO_INSTALL_MISSING_TOOLS}")" == "true" ]]; then
    warn "Missing command '${command_name}' for ${purpose}. Attempting installation."
    if run_install_command "${command_name}" && can_run_cmd "${command_name}"; then
      info "Installed '${command_name}'."
      return 0
    fi
    warn "Automatic installation failed for '${command_name}'."
  fi

  hint="$(install_hint_for_command "${command_name}")"
  die "Required command not found: ${command_name} (${purpose}). ${hint}"
}

require_file() {
  local path="${1:-}"
  [[ -n "${path}" ]] || die "require_file needs a file path."
  [[ -f "${path}" ]] || die "Required file not found: ${path}"
}

require_arg() {
  local value="${1:-}"
  local name="${2:-argument}"
  [[ -n "${value}" ]] || die "Missing required argument: ${name}"
}

in_list() {
  local needle="${1:-}"
  shift || true
  local candidate
  for candidate in "$@"; do
    [[ "${candidate}" == "${needle}" ]] && return 0
  done
  return 1
}

detect_build_tool() {
  local has_maven="false"
  local has_gradle="false"

  [[ -f "pom.xml" ]] && has_maven="true"
  [[ -f "build.gradle" || -f "build.gradle.kts" ]] && has_gradle="true"

  if [[ "${has_maven}" == "true" && "${has_gradle}" == "true" ]]; then
    die "Both Maven and Gradle build files found. Pass --build-tool explicitly."
  fi

  if [[ "${has_maven}" == "true" ]]; then
    echo "maven"
    return 0
  fi

  if [[ "${has_gradle}" == "true" ]]; then
    echo "gradle"
    return 0
  fi

  die "Could not detect build tool. No pom.xml/build.gradle/build.gradle.kts found."
}
