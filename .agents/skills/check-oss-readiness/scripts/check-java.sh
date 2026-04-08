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

# ---------------------------------------------------------------------------
# check-java.sh — Java / Maven specific OSS-readiness checks
#
# Usage:  bash check-java.sh TARGET
#
# TARGET is the directory to check (a Maven module root or project root).
# Output: one line per check in the format  CHECK_ID|STATUS|message
# ---------------------------------------------------------------------------
set -euo pipefail

TARGET="${1:-.}"
TARGET="$(cd "$TARGET" && pwd)"

EXCLUDE_DIRS="--exclude-dir=target --exclude-dir=.git --exclude-dir=node_modules"

# Helper: emit a result line
result() { echo "$1|$2|$3"; }

# ── 1.2 Copyright / license headers ──────────────────────────────────────────

missing_header_files=$(grep -rL "Copyright\|license\|Licensed\|SPDX-License-Identifier" \
  "$TARGET"/src/main/java --include="*.java" $EXCLUDE_DIRS 2>/dev/null || true)

if [ -z "$missing_header_files" ]; then
  result "1.2" "PASS" "All Java source files contain a copyright or license header"
else
  count=$(echo "$missing_header_files" | wc -l | tr -d ' ')
  result "1.2" "WARN" "$count Java file(s) missing copyright/license header — first: $(echo "$missing_header_files" | head -1 | sed "s|$TARGET/||")"
fi

# ── 1.3 Dependency license compatibility ─────────────────────────────────────

if command -v mvn &>/dev/null && [ -f "$TARGET/pom.xml" ]; then
  dep_output=$(mvn -f "$TARGET/pom.xml" dependency:tree -DoutputType=text 2>/dev/null || echo "MVN_FAILED")
  if echo "$dep_output" | grep -qi "MVN_FAILED"; then
    result "1.3" "WARN" "Could not run mvn dependency:tree — verify manually"
  else
    gpl_hits=$(echo "$dep_output" | grep -i "gpl\|agpl\|cddl" | grep -vi "lgpl" || true)
    if [ -n "$gpl_hits" ]; then
      result "1.3" "FAIL" "Copyleft dependency detected: $(echo "$gpl_hits" | head -1 | xargs)"
    else
      result "1.3" "PASS" "No copyleft (GPL/AGPL/CDDL) dependencies detected in dependency tree"
    fi
  fi
else
  result "1.3" "WARN" "Maven not available or no pom.xml found — skipped dependency license check"
fi

# ── 1.5 SPDX-License-Identifier in headers ──────────────────────────────────

missing_spdx=$(grep -rL "SPDX-License-Identifier" \
  "$TARGET"/src/main/java --include="*.java" $EXCLUDE_DIRS 2>/dev/null || true)

if [ -z "$missing_spdx" ]; then
  result "1.5" "PASS" "All Java source files contain an SPDX-License-Identifier"
else
  count=$(echo "$missing_spdx" | wc -l | tr -d ' ')
  result "1.5" "WARN" "$count Java file(s) missing SPDX-License-Identifier — first: $(echo "$missing_spdx" | head -1 | sed "s|$TARGET/||")"
fi

# ── 2.2 Secrets in configuration files ───────────────────────────────────────

config_secrets=""
for f in $(find "$TARGET/src" \( -name "application.properties" -o -name "application*.yml" -o -name "application*.yaml" \) 2>/dev/null); do
  hits=$(grep -ni "password\|token\|api-key\|secret\|private.key" "$f" \
    | grep -v '^\s*#' \
    | grep -vi '\${\|changeit\|placeholder\|TODO\|CHANGE_ME\|your-' || true)
  if [ -n "$hits" ]; then
    config_secrets="$config_secrets\n$(echo "$hits" | head -1)"
  fi
done

if [ -z "$config_secrets" ]; then
  result "2.2" "PASS" "No literal secrets found in Java config files"
else
  result "2.2" "FAIL" "Possible literal secret in config — $(echo -e "$config_secrets" | head -1 | xargs)"
fi

# ── 2.6 Known vulnerability scanning ────────────────────────────────────────

if [ -f "$TARGET/pom.xml" ]; then
  if grep -q "dependency-check-maven\|owasp" "$TARGET/pom.xml" 2>/dev/null; then
    result "2.6" "PASS" "OWASP dependency-check plugin is configured in pom.xml"
  else
    result "2.6" "WARN" "No OWASP dependency-check plugin configured — consider adding org.owasp:dependency-check-maven"
  fi
fi

# ── 3.4 Public API documentation (Javadoc) ──────────────────────────────────

if [ -d "$TARGET/src/main/java" ]; then
  public_files=$(grep -rl "public class\|public interface\|public @interface\|public enum" \
    "$TARGET/src/main/java" --include="*.java" $EXCLUDE_DIRS 2>/dev/null || true)

  if [ -n "$public_files" ]; then
    missing_javadoc=$(echo "$public_files" | xargs grep -L "/\*\*" 2>/dev/null || true)
    if [ -z "$missing_javadoc" ]; then
      result "3.4" "PASS" "All public Java types have Javadoc"
    else
      count=$(echo "$missing_javadoc" | wc -l | tr -d ' ')
      result "3.4" "WARN" "$count public Java type(s) without Javadoc — first: $(echo "$missing_javadoc" | head -1 | sed "s|$TARGET/||")"
    fi
  else
    result "3.4" "PASS" "No public Java types found (nothing to document)"
  fi
fi

# ── 4.1 No private package registries ────────────────────────────────────────

pom_files=$(find "$TARGET" -name "pom.xml" -not -path "*/target/*" 2>/dev/null)
private_repos=""
for pom in $pom_files; do
  urls=$(grep -oP '<url>\K[^<]+' "$pom" 2>/dev/null || true)
  for url in $urls; do
    if echo "$url" | grep -qvE "repo1\.maven\.org|repo\.spring\.io|packages\.spring\.io|central\.sonatype|maven\.apache\.org|plugins\.gradle\.org"; then
      if echo "$url" | grep -qiE "nexus|artifactory|packages\.github|private|internal"; then
        private_repos="$private_repos $url"
      fi
    fi
  done
done

if [ -z "$private_repos" ]; then
  result "4.1" "PASS" "No private Maven registries detected"
else
  result "4.1" "FAIL" "Private registry detected:$(echo "$private_repos" | head -1)"
fi

# ── 4.2 SNAPSHOT dependencies ────────────────────────────────────────────────

if command -v mvn &>/dev/null && [ -f "$TARGET/pom.xml" ]; then
  snapshots=$(mvn -f "$TARGET/pom.xml" dependency:tree 2>/dev/null | grep "SNAPSHOT" | grep -v "^\[INFO\] dev\." || true)
  if [ -z "$snapshots" ]; then
    result "4.2" "PASS" "No external SNAPSHOT dependencies"
  else
    count=$(echo "$snapshots" | wc -l | tr -d ' ')
    result "4.2" "WARN" "$count external SNAPSHOT dependency(ies) — first: $(echo "$snapshots" | head -1 | xargs)"
  fi
fi

# ── 4.4 Standalone build ─────────────────────────────────────────────────────

if command -v mvn &>/dev/null && [ -f "$TARGET/pom.xml" ]; then
  if mvn -f "$TARGET/pom.xml" clean verify -DskipTests -q 2>/dev/null; then
    result "4.4" "PASS" "Maven build succeeded (mvn clean verify -DskipTests)"
  else
    result "4.4" "FAIL" "Maven build failed — run mvn clean verify -DskipTests for details"
  fi
fi

# ── 4.5 Pinned dependency versions ──────────────────────────────────────────

version_ranges=$(grep -rn "\[.*,.*\]" "$TARGET/pom.xml" 2>/dev/null | grep -i "version" || true)
if [ -z "$version_ranges" ]; then
  result "4.5" "PASS" "No version ranges detected in pom.xml"
else
  result "4.5" "WARN" "Version range(s) found in pom.xml — pin to exact versions for reproducibility"
fi

# ── 5.3 Commented-out code ──────────────────────────────────────────────────

if [ -d "$TARGET/src/main/java" ]; then
  total_lines=$(find "$TARGET/src/main/java" -name "*.java" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')
  comment_lines=$(grep -rc "^\s*//" "$TARGET/src/main/java" --include="*.java" $EXCLUDE_DIRS 2>/dev/null \
    | awk -F: '{s+=$2} END {print s+0}')

  if [ "$total_lines" -gt 0 ]; then
    ratio=$((comment_lines * 100 / total_lines))
    if [ "$ratio" -gt 20 ]; then
      result "5.3" "WARN" "Commented-out code ratio is ${ratio}% (${comment_lines}/${total_lines} lines) — exceeds 20% threshold"
    else
      result "5.3" "PASS" "Commented-out code ratio is ${ratio}% — within threshold"
    fi
  fi
fi

# ── 5.4 Tests present ───────────────────────────────────────────────────────

if [ -d "$TARGET/src/test" ]; then
  test_count=$(find "$TARGET/src/test" -name "*Test.java" -o -name "*Tests.java" -o -name "*IT.java" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$test_count" -eq 0 ]; then
    result "5.4" "FAIL" "No test files found in $TARGET/src/test"
  else
    result "5.4" "PASS" "$test_count test file(s) found"
  fi
else
  result "5.4" "FAIL" "No src/test directory found"
fi

# ── 5.5 Tests pass ──────────────────────────────────────────────────────────

if command -v mvn &>/dev/null && [ -f "$TARGET/pom.xml" ]; then
  if mvn -f "$TARGET/pom.xml" test -q 2>/dev/null; then
    result "5.5" "PASS" "All Maven tests passed"
  else
    result "5.5" "FAIL" "Maven tests failed — run mvn test for details"
  fi
fi

# ── 5.6 Static analysis configured ──────────────────────────────────────────

static_tools=""
for pom in $pom_files; do
  for tool in "maven-checkstyle-plugin" "spotbugs-maven-plugin" "error-prone" "pmd-maven-plugin" "spotless-maven-plugin"; do
    if grep -q "$tool" "$pom" 2>/dev/null; then
      static_tools="$static_tools $tool"
    fi
  done
done

if [ -n "$static_tools" ]; then
  result "5.6" "PASS" "Static analysis configured:$static_tools"
else
  result "5.6" "WARN" "No static analysis plugin found — consider checkstyle, spotbugs, error-prone, or pmd"
fi

# ── 6.1 .gitignore coverage ─────────────────────────────────────────────────

gitignore_file="$TARGET/.gitignore"
if [ ! -f "$gitignore_file" ]; then
  # Try project root
  gitignore_file="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)/.gitignore" || true
fi

if [ -f "$gitignore_file" ]; then
  missing_entries=""
  for entry in "target/" "*.iml" ".idea/"; do
    if ! grep -q "$entry" "$gitignore_file" 2>/dev/null; then
      missing_entries="$missing_entries $entry"
    fi
  done

  if [ -z "$missing_entries" ]; then
    result "6.1" "PASS" "Java-related .gitignore entries present"
  else
    result "6.1" "WARN" "Missing .gitignore entries:$missing_entries"
  fi
else
  result "6.1" "WARN" "No .gitignore found"
fi
