#!/usr/bin/env bash
# audit.sh — strictly read-only data collector for the repo-cleanup-audit
# slash command.
#
# This script gathers facts about a Git repository and (optionally) its
# associated GitHub project. It NEVER mutates the repository, the working
# tree, the object database, remote refs, GitHub state, or any file outside
# the output directory it is told to use.
#
# Forbidden by design (the script will refuse, see _guard()):
#   - git commands that write (branch -d/-D, push, fetch, pull, checkout,
#     switch, merge, rebase, commit, add, rm, mv, reset, stash push/pop/drop,
#     tag writes, remote writes, config writes, gc, prune, repack, clean,
#     worktree add/remove/prune)
#   - gh commands that write (issue/pr/label/release/repo writes, api with
#     non-GET method)
#   - any installer or package-manager call
#
# Usage:
#   bash audit.sh <repo-path> <output-dir> [--quick]
#
# The script produces plain-text fact files under <output-dir>/facts/. It
# never writes anywhere else.

set -u
# Note: -e is intentionally NOT set. We want to keep collecting facts even
# when individual probes fail (e.g. shallow clone, no remotes, gh missing).

#-----------------------------------------------------------------------------
# Safety guard: refuse to ever exec a forbidden command, even if a future
# edit accidentally introduces one. Every shell-out goes through _run().
#-----------------------------------------------------------------------------

# Patterns that, if present in the command line of a _run() call, abort the
# script. Patterns are matched as POSIX extended regex against the joined
# argv string.
_FORBIDDEN_PATTERNS=(
  # git mutating subcommands
  '(^|[[:space:]])git[[:space:]]+(push|pull|fetch|checkout|switch|restore|merge|rebase|cherry-pick|revert|commit|add|rm|mv|reset|gc|prune|repack|clean|init|clone)([[:space:]]|$)'
  '(^|[[:space:]])git[[:space:]]+branch[[:space:]]+(-d|-D|--delete|-m|--move|-c|--copy|--force)'
  '(^|[[:space:]])git[[:space:]]+tag[[:space:]]+(-d|--delete|-f|--force|-a|-s|-u)'
  '(^|[[:space:]])git[[:space:]]+remote[[:space:]]+(add|remove|rename|set-url|set-head|prune)'
  '(^|[[:space:]])git[[:space:]]+config[[:space:]]+(--add|--unset|--unset-all|--rename-section|--remove-section|--replace-all)'
  # bare `git stash` (alias for `stash push`) and any flag-form, plus write subcommands.
  # `git stash list` and `git stash show` remain allowed.
  '(^|[[:space:]])git[[:space:]]+stash[[:space:]]+(push|save|pop|drop|apply|create|store|clear)([[:space:]]|$)'
  '(^|[[:space:]])git[[:space:]]+stash([[:space:]]*$|[[:space:]]+-)'
  '(^|[[:space:]])git[[:space:]]+worktree[[:space:]]+(add|remove|move|prune|repair|lock|unlock)'
  '(^|[[:space:]])git[[:space:]]+update-ref'
  # symbolic-ref write form: a non-flag positional after the subcommand means it's
  # being asked to set HEAD. Read forms use --short / --quiet / -q only.
  '(^|[[:space:]])git[[:space:]]+symbolic-ref([[:space:]]+--?[A-Za-z-]+)*[[:space:]]+(HEAD|refs/)[^[:space:]]*[[:space:]]+(HEAD|refs/)'
  '(^|[[:space:]])git[[:space:]]+filter-(branch|repo)'
  # gh mutating subcommands. `checkout` mutates the working tree.
  '(^|[[:space:]])gh[[:space:]]+(issue|pr|label|release|repo|gist|secret|variable|workflow|run|cache)[[:space:]]+(create|close|edit|delete|comment|merge|reopen|lock|unlock|pin|unpin|transfer|fork|clone|rerun|cancel|disable|enable|set|update|add|remove|checkout)'
  # gh api with a non-GET method, in any case and either flag form (-X / --method),
  # including --method=POST and -XPOST. Guard runs grep -E -i so case is handled.
  '(^|[[:space:]])gh[[:space:]]+api([[:space:]]|.*[[:space:]])(-X[[:space:]=]*|--method[[:space:]=]+)(POST|PUT|PATCH|DELETE)'
  '(^|[[:space:]])gh[[:space:]]+auth[[:space:]]+(login|logout|refresh|setup-git)'
  # installers / package managers
  '(^|[[:space:]])(pip|pipx|pip3|uv|poetry|conda|npm|pnpm|yarn|bun|brew|apt|apt-get|dnf|yum|pacman|zypper|cargo|go|gem|nix-env)[[:space:]]+(install|add|remove|uninstall|update|upgrade|build|publish)'
  # shell file mutators
  '(^|[[:space:]])(rm|rmdir|mv|cp|chmod|chown|tee|truncate|ln|mkfifo)[[:space:]]'
)

_guard() {
  # Scan the joined argv against forbidden patterns. Case-insensitive so
  # variants like `gh api -X post` or `GIT PUSH` cannot bypass the guard.
  # Note: shell redirections (`>`, `>>`) are interpreted by the caller and
  # never reach _run's argv, so the guard can only police what _run sees.
  # All file writes in this script go through `_write` / `_append` which
  # are anchored under $FACTS_DIR; no other code path writes files.
  local joined="$*"
  local pat
  for pat in "${_FORBIDDEN_PATTERNS[@]}"; do
    if printf '%s' "$joined" | grep -E -i -q -- "$pat"; then
      printf 'audit.sh: refusing forbidden command: %s\n' "$joined" >&2
      printf 'audit.sh: this command is strictly read-only\n' >&2
      exit 99
    fi
  done
}

# _run runs a command after guarding it. stdout is captured by the caller;
# stderr is suppressed by default to keep fact files clean — callers that
# want stderr should redirect explicitly.
_run() {
  _guard "$@"
  "$@"
}

#-----------------------------------------------------------------------------
# Argument parsing
#-----------------------------------------------------------------------------

usage() {
  cat <<'EOF' >&2
Usage: bash audit.sh <repo-path> <output-dir> [--quick]

  <repo-path>   Path to a Git repository (or any path inside one).
  <output-dir>  Directory to write fact files into. Will be created if
                missing. The script writes only inside this directory.
  --quick       Sample large lists and cap expensive history scans.

The script is strictly read-only. It will exit non-zero if a forbidden
command is attempted internally.
EOF
  exit 2
}

REPO_PATH="${1:-}"
OUT_DIR="${2:-}"
MODE="full"
if [ "${3:-}" = "--quick" ]; then
  MODE="quick"
fi

[ -z "$REPO_PATH" ] && usage
[ -z "$OUT_DIR" ] && usage

if [ ! -d "$REPO_PATH" ]; then
  printf 'audit.sh: repo path does not exist: %s\n' "$REPO_PATH" >&2
  exit 3
fi

# Resolve absolute paths without using readlink -f (not portable on macOS).
_abspath() {
  local p="$1"
  ( cd "$p" 2>/dev/null && pwd -P ) || printf '%s' "$p"
}
REPO_ABS="$(_abspath "$REPO_PATH")"

mkdir -p "$OUT_DIR" || { printf 'audit.sh: cannot create output dir: %s\n' "$OUT_DIR" >&2; exit 4; }
_OUT_ABS="$(_abspath "$OUT_DIR")"
FACTS_DIR="$_OUT_ABS/facts"
mkdir -p "$FACTS_DIR" || { printf 'audit.sh: cannot create facts dir\n' >&2; exit 4; }

# Verify it's a git repo.
if ! ( cd "$REPO_ABS" && _run git rev-parse --is-inside-work-tree >/dev/null 2>&1 ); then
  # Could still be a bare repo.
  if ! ( cd "$REPO_ABS" && _run git rev-parse --is-bare-repository >/dev/null 2>&1 ); then
    printf 'audit.sh: not a git repository: %s\n' "$REPO_ABS" >&2
    exit 5
  fi
fi

cd "$REPO_ABS"

#-----------------------------------------------------------------------------
# Helpers
#-----------------------------------------------------------------------------

_have() { command -v "$1" >/dev/null 2>&1; }

# Write to a fact file, anchored under $FACTS_DIR. Refuses paths containing
# '..' or absolute paths.
_write() {
  local rel="$1"
  case "$rel" in
    /*|*..*) printf 'audit.sh: rejecting unsafe fact path: %s\n' "$rel" >&2; return 1 ;;
  esac
  cat > "$FACTS_DIR/$rel"
}

_append() {
  local rel="$1"
  case "$rel" in
    /*|*..*) printf 'audit.sh: rejecting unsafe fact path: %s\n' "$rel" >&2; return 1 ;;
  esac
  cat >> "$FACTS_DIR/$rel"
}

# Cap quick-mode list lengths.
_cap() {
  if [ "$MODE" = "quick" ]; then
    head -n 200
  else
    cat
  fi
}

#-----------------------------------------------------------------------------
# 0. Environment summary
#-----------------------------------------------------------------------------

{
  printf 'repo_path\t%s\n' "$REPO_ABS"
  printf 'output_dir\t%s\n' "$_OUT_ABS"
  printf 'mode\t%s\n' "$MODE"
  printf 'date_utc\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || true)"
  printf 'uname\t%s\n' "$(uname -a 2>/dev/null || true)"
  printf 'shell\t%s\n' "${SHELL:-unknown}"
  printf 'git_version\t%s\n' "$(_run git --version 2>/dev/null || true)"
  if _have gh; then
    printf 'gh_version\t%s\n' "$(_run gh --version 2>/dev/null | head -n1)"
  else
    printf 'gh_version\tabsent\n'
  fi
  if _have jq; then
    printf 'jq_version\t%s\n' "$(jq --version 2>/dev/null)"
  else
    printf 'jq_version\tabsent\n'
  fi
} | _write env.tsv

#-----------------------------------------------------------------------------
# 1. Repo state snapshot (used to verify nothing changed)
#-----------------------------------------------------------------------------

_run git rev-parse HEAD 2>/dev/null | _write head-sha.txt
_run git rev-parse --abbrev-ref HEAD 2>/dev/null | _write head-branch.txt
_run git status --porcelain=v2 --branch 2>/dev/null | _write status.txt

# Default branch detection: try origin/HEAD, fall back to common names.
{
  _run git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null \
    || { for b in main master trunk default; do
           if _run git show-ref --verify --quiet "refs/heads/$b" 2>/dev/null; then
             printf '%s\n' "$b"; break
           fi
         done; }
} | _write default-branch.txt

_run git config --get core.bare 2>/dev/null | _write core-bare.txt
_run git rev-parse --is-shallow-repository 2>/dev/null | _write is-shallow.txt

#-----------------------------------------------------------------------------
# 2. Branches
#-----------------------------------------------------------------------------

# Local branches with last-commit date and tracking info.
_run git for-each-ref --sort=-committerdate \
  --format='%(refname:short)%09%(committerdate:iso8601)%09%(committerdate:relative)%09%(upstream:short)%09%(upstream:track)%09%(authoremail)' \
  refs/heads/ 2>/dev/null | _cap | _write branches-local.tsv

# Remote-tracking branches.
_run git for-each-ref --sort=-committerdate \
  --format='%(refname:short)%09%(committerdate:iso8601)%09%(committerdate:relative)%09%(authoremail)' \
  refs/remotes/ 2>/dev/null | _cap | _write branches-remote.tsv

# Merged / not-merged into default branch.
DEFAULT_BRANCH="$(cat "$FACTS_DIR/default-branch.txt" 2>/dev/null | head -n1)"
DEFAULT_BRANCH="${DEFAULT_BRANCH##*/}"
if [ -n "$DEFAULT_BRANCH" ] && _run git show-ref --verify --quiet "refs/heads/$DEFAULT_BRANCH" 2>/dev/null; then
  _run git branch --merged "$DEFAULT_BRANCH" 2>/dev/null | _cap | _write branches-merged.txt
  _run git branch --no-merged "$DEFAULT_BRANCH" 2>/dev/null | _cap | _write branches-no-merged.txt
else
  printf 'default branch not resolvable; merged/no-merged skipped\n' | _write branches-merged.txt
  printf 'default branch not resolvable; merged/no-merged skipped\n' | _write branches-no-merged.txt
fi

# Ahead/behind for every local branch with an upstream.
{
  printf 'branch\tupstream\tahead\tbehind\n'
  _run git for-each-ref --format='%(refname:short)%09%(upstream:short)' refs/heads/ 2>/dev/null \
    | while IFS=$'\t' read -r br up; do
        [ -z "$up" ] && continue
        counts="$(_run git rev-list --left-right --count "$br...$up" 2>/dev/null)"
        ahead="${counts%%[[:space:]]*}"
        behind="${counts##*[[:space:]]}"
        printf '%s\t%s\t%s\t%s\n' "$br" "$up" "$ahead" "$behind"
      done
} | _write branches-ahead-behind.tsv

# Branches whose upstream is gone.
_run git branch -vv 2>/dev/null | grep -F ': gone]' | _write branches-gone-upstream.txt

#-----------------------------------------------------------------------------
# 3. Worktrees, stashes, tags
#-----------------------------------------------------------------------------

_run git worktree list --porcelain 2>/dev/null | _write worktrees.txt
_run git stash list 2>/dev/null | _write stashes.txt
_run git tag --list --format='%(refname:short)%09%(objecttype)%09%(taggerdate:iso8601)%09%(*objectname)%09%(objectname)' \
  2>/dev/null | _cap | _write tags.tsv

#-----------------------------------------------------------------------------
# 4. Remotes
#-----------------------------------------------------------------------------

_run git remote -v 2>/dev/null | _write remotes.txt

# git remote show <name> hits the network read-only. Skip if no remotes.
if [ -s "$FACTS_DIR/remotes.txt" ]; then
  awk '{print $1}' "$FACTS_DIR/remotes.txt" | sort -u | while read -r r; do
    [ -z "$r" ] && continue
    safe="$(printf '%s' "$r" | tr -c 'A-Za-z0-9._-' '_')"
    _run git remote show "$r" 2>&1 | _write "remote-show-$safe.txt"
  done
fi

#-----------------------------------------------------------------------------
# 5. Recent activity / authors
#-----------------------------------------------------------------------------

LIMIT=200
[ "$MODE" = "quick" ] && LIMIT=50
_run git log --no-merges -n "$LIMIT" --date=short \
  --pretty=format:'%h%x09%ad%x09%ae%x09%s' 2>/dev/null | _write recent-commits.tsv

# Author summary. In quick mode, sample the last 500 commits via git log
# (works on shallow clones where HEAD~500 may not exist). In full mode,
# shortlog walks the entire reachable history.
if [ "$MODE" = "quick" ]; then
  _run git log -n 500 --no-merges --pretty=format:'%aN <%aE>' 2>/dev/null \
    | sort | uniq -c | sort -rn | _write commit-author-summary.tsv
else
  _run git shortlog -sne --no-merges 2>/dev/null | _write commit-author-summary.tsv
fi

#-----------------------------------------------------------------------------
# 6. Large blobs in history (rev-list + cat-file)
#-----------------------------------------------------------------------------

# This is the only somewhat expensive step. In quick mode we cap rev-list to
# the most recent 5000 objects.
{
  if _run git rev-parse --is-shallow-repository 2>/dev/null | grep -q true; then
    printf 'shallow_clone_unreliable\t1\n'
  fi
  if [ "$MODE" = "quick" ]; then
    _run git rev-list --objects --all 2>/dev/null | head -n 5000
  else
    _run git rev-list --objects --all 2>/dev/null
  fi \
    | awk '{print $1, $2}' \
    | _run git cat-file --batch-check='%(objectname) %(objecttype) %(objectsize) %(rest)' 2>/dev/null \
    | awk '$2=="blob" && $3+0 > 1048576 {print $3"\t"$1"\t"$4}' \
    | sort -nr -k1 \
    | head -n 100
} | _write large-blobs-in-history.tsv

#-----------------------------------------------------------------------------
# 7. On-disk hygiene: large files, suspicious paths, gitignore misses
#-----------------------------------------------------------------------------

# Large files in the working tree (>10MB), excluding .git.
if _have find; then
  _run find . -path ./.git -prune -o -type f -size +10M -print 2>/dev/null \
    | _cap \
    | while IFS= read -r p; do
        sz="$(_run du -b "$p" 2>/dev/null | awk '{print $1}')"
        [ -z "$sz" ] && sz="$(_run du -k "$p" 2>/dev/null | awk '{print $1*1024}')"
        printf '%s\t%s\n' "${sz:-?}" "$p"
      done \
    | sort -nr \
    | _write large-files-on-disk.tsv
else
  printf 'find absent; skipped\n' | _write large-files-on-disk.tsv
fi

# Suspicious tracked paths: secrets, build artifacts, OS junk.
{
  _run git ls-files 2>/dev/null | grep -E -i \
    -e '(^|/)\.env(\..*)?$' \
    -e '(^|/)id_rsa(\..*)?$' \
    -e '(^|/).*\.pem$' \
    -e '(^|/).*\.pfx$' \
    -e '(^|/).*\.kdbx$' \
    -e '(^|/)credentials(\..*)?$' \
    -e '(^|/)secrets?(\..*)?$' \
    -e '(^|/)\.npmrc$' \
    -e '(^|/)\.pypirc$' \
    -e '(^|/)\.aws/credentials$' \
    -e '(^|/)node_modules/' \
    -e '(^|/)dist/' \
    -e '(^|/)build/' \
    -e '(^|/)\.next/' \
    -e '(^|/)\.venv/' \
    -e '(^|/)__pycache__/' \
    -e '(^|/)target/' \
    -e '(^|/)\.DS_Store$' \
    -e '(^|/)Thumbs\.db$' \
    || true
} | _cap | _write suspicious-paths.txt

# .gitignore "misses": tracked files that match common ignore patterns.
# We approximate by reusing the same regex as suspicious-paths for build
# artifacts (already captured above) and add `*.log`, `*.tmp`, `*.swp`.
{
  _run git ls-files 2>/dev/null | grep -E -i \
    -e '\.log$' \
    -e '\.tmp$' \
    -e '\.swp$' \
    -e '\.bak$' \
    || true
} | _cap | _write gitignore-misses.txt

# Submodules.
_run git submodule status 2>/dev/null | _write submodules.txt

#-----------------------------------------------------------------------------
# 8. GitHub state (only if gh is installed AND authenticated)
#-----------------------------------------------------------------------------

if _have gh; then
  if _run gh auth status >/dev/null 2>&1; then
    # Issues. Cap at 200 in full mode, 50 in quick mode.
    GH_LIMIT=200
    [ "$MODE" = "quick" ] && GH_LIMIT=50
    _run gh issue list --state all --limit "$GH_LIMIT" \
      --json number,title,state,labels,assignees,milestone,createdAt,updatedAt,author,url \
      2>/dev/null | _write gh-issues.json

    _run gh pr list --state all --limit "$GH_LIMIT" \
      --json number,title,state,isDraft,labels,createdAt,updatedAt,headRefName,baseRefName,author,url \
      2>/dev/null | _write gh-prs.json

    _run gh repo view --json name,owner,defaultBranchRef,description,isArchived,isFork,visibility,pushedAt,url \
      2>/dev/null | _write gh-repo.json

    printf 'authenticated\n' | _write gh-status.txt
  else
    printf 'unauthenticated\n' | _write gh-status.txt
  fi
else
  printf 'absent\n' | _write gh-status.txt
fi

#-----------------------------------------------------------------------------
# 9. Final post-condition snapshot (so the agent can diff and prove no-op)
#-----------------------------------------------------------------------------

_run git rev-parse HEAD 2>/dev/null | _write head-sha-after.txt
_run git status --porcelain=v2 --branch 2>/dev/null | _write status-after.txt

# Cheap sanity: HEAD must match.
if ! diff -q "$FACTS_DIR/head-sha.txt" "$FACTS_DIR/head-sha-after.txt" >/dev/null 2>&1; then
  printf 'audit.sh: HEAD changed during audit; this should be impossible\n' >&2
  exit 98
fi
if ! diff -q "$FACTS_DIR/status.txt" "$FACTS_DIR/status-after.txt" >/dev/null 2>&1; then
  printf 'audit.sh: working tree changed during audit; this should be impossible\n' >&2
  exit 98
fi

printf 'audit.sh: facts written to %s\n' "$FACTS_DIR"
exit 0
