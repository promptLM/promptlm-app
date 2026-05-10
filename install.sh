#!/usr/bin/env bash
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

# Copyright 2025 promptics
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

# ---------------------------------------------------------------------------
# install.sh — download and configure agent-skills for your project
#
# Usage:
#   bash install.sh [REF]          # First install or full reconfigure
#   bash install.sh --update       # Re-apply templates with saved config
#   bash install.sh --config-only  # Just update config, no download
#
# REF is a branch name or tag (default: main).
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="https://github.com/promptics/agentskills"
REF="${1:-main}"
TARGET=".agents/skills"
CONFIG_FILE="$TARGET/skills.config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Collect configuration from user
collect_config() {
    echo ""
    echo "=== Skills Configuration ==="
    echo "These values will be used to customize the skills for your project."
    echo ""
    
    # Use existing values as defaults if updating
    local default_holder="Your Company"
    local default_license="Apache-2.0"
    local default_security="security@example.com"
    local default_conduct="conduct@example.com"
    
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        default_holder="${COPYRIGHT_HOLDER:-$default_holder}"
        default_license="${LICENSE:-$default_license}"
        default_security="${SECURITY_EMAIL:-$default_security}"
        default_conduct="${CONDUCT_EMAIL:-$default_conduct}"
    fi
    
    read -p "Copyright holder [$default_holder]: " COPYRIGHT_HOLDER
    COPYRIGHT_HOLDER="${COPYRIGHT_HOLDER:-$default_holder}"
    
    read -p "License [$default_license]: " LICENSE
    LICENSE="${LICENSE:-$default_license}"
    
    read -p "Security email [$default_security]: " SECURITY_EMAIL
    SECURITY_EMAIL="${SECURITY_EMAIL:-$default_security}"
    
    read -p "Code of conduct email [$default_conduct]: " CONDUCT_EMAIL
    CONDUCT_EMAIL="${CONDUCT_EMAIL:-$default_conduct}"
    
    # Save config
    mkdir -p "$TARGET"
    cat > "$CONFIG_FILE" << EOF
COPYRIGHT_HOLDER='$COPYRIGHT_HOLDER'
LICENSE='$LICENSE'
SECURITY_EMAIL='$SECURITY_EMAIL'
CONDUCT_EMAIL='$CONDUCT_EMAIL'
COPYRIGHT_YEAR='$(date +%Y)'
EOF
    
    log_success "Configuration saved to $CONFIG_FILE"
}

# Apply templates with envsubst
apply_templates() {
    local skills_dir=$1
    
    log_info "Applying templates..."
    
    export COPYRIGHT_HOLDER LICENSE SECURITY_EMAIL CONDUCT_EMAIL COPYRIGHT_YEAR
    
    # Find all template files and process them
    find "$skills_dir" -name "*.template" -o -name "*.template.md" -o -name "*.template.sh" 2>/dev/null | while read template; do
        # Determine target file name (remove .template extension)
        local target="${template%.template}"
        target="${target%.template.md}.md"
        target="${target%.template.sh}.sh"
        
        # Process template
        if command -v envsubst >/dev/null 2>&1; then
            envsubst < "$template" > "$target"
        else
            # Fallback: use shell variable expansion
            eval "echo \"$(cat "$template")\"" > "$target" 2>/dev/null || {
                log_error "Failed to process template: $template"
                continue
            }
        fi
        
        # Make shell scripts executable
        if [[ "$target" == *.sh ]]; then
            chmod +x "$target" 2>/dev/null || true
        fi
        
        log_success "Generated: ${target#$skills_dir/}"
    done
}

# Download skills from repo
download_skills() {
    log_info "Downloading agent-skills ($REF)..."
    
    rm -rf "$TARGET"
    mkdir -p "$TARGET"
    
    # Try to download from branch first, then from tags
    if ! curl -fsSL "$REPO/archive/refs/heads/$REF.tar.gz" 2>/dev/null \
        | tar xz --strip-components=2 -C "$TARGET" "agentskills-$REF/skills/" 2>/dev/null; then
        
        log_info "Trying tags..."
        curl -fsSL "$REPO/archive/refs/tags/$REF.tar.gz" \
            | tar xz --strip-components=2 -C "$TARGET" "agentskills-$REF/skills/"
    fi
    
    log_success "Skills downloaded to $TARGET/"
}

# Update mode: re-apply templates without downloading
update_mode() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "No config found at $CONFIG_FILE"
        echo "Run: bash install.sh (without --update) to configure first"
        exit 1
    fi
    
    log_info "Update mode: re-applying templates with saved configuration"
    source "$CONFIG_FILE"
    apply_templates "$TARGET"
    log_success "Skills updated with your configuration"
}

# Config-only mode: just update the config file
config_only_mode() {
    collect_config
    if [[ -d "$TARGET" ]]; then
        apply_templates "$TARGET"
        log_success "Templates re-applied with new configuration"
    else
        echo ""
        log_info "Note: Skills directory not found. Run install.sh to download skills."
    fi
}

# Detect skill bundles among installed skills.
# A bundle is a coordinated set of skills sharing a common prefix
# (e.g. research-methodology + research-programme + research-topic).
# Hardcoded for now — update this function when adding new bundles.
list_bundles() {
    local research_present=0
    for s in research-methodology research-programme research-topic; do
        [[ -d "$TARGET/$s" ]] && research_present=$((research_present + 1))
    done
    if [[ $research_present -ge 2 ]]; then
        echo ""
        echo "Skill bundles installed:"
        echo "  research bundle — research-methodology + research-programme + research-topic"
        echo "    Orchestrated multi-topic research producing a pre-implementation"
        echo "    design dossier with a verified sub-agent harness, working-set /"
        echo "    archive separation, and a mandatory critic pass per topic."
        echo "    Read research-methodology first."
    fi
}

# Main installation flow
main_install() {
    download_skills
    collect_config
    apply_templates "$TARGET"

    echo ""
    log_success "Installation complete!"
    list_bundles
    echo ""
    echo "Next steps:"
    echo "  git add $TARGET && git commit -m 'Import agent-skills ($REF)'"
    echo ""
    echo "To update skills later:"
    echo "  bash install.sh --update"
    echo ""
    echo "To change configuration:"
    echo "  bash install.sh --config-only"
}

# Parse arguments
case "${1:-}" in
    --update|-u)
        update_mode
        ;;
    --config-only|-c)
        config_only_mode
        ;;
    --help|-h)
        echo "Usage: bash install.sh [REF|OPTIONS]"
        echo ""
        echo "Arguments:"
        echo "  REF              Branch or tag to install (default: main)"
        echo ""
        echo "Options:"
        echo "  --update, -u     Re-apply templates with saved config (after git subtree pull)"
        echo "  --config-only    Update configuration without downloading"
        echo "  --help, -h       Show this help"
        echo ""
        echo "Examples:"
        echo "  bash install.sh                    # Install latest main"
        echo "  bash install.sh v1.0.0              # Install specific version"
        echo "  bash install.sh --update           # Re-apply templates after update"
        exit 0
        ;;
    *)
        main_install
        ;;
esac  
