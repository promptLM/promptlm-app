#!/usr/bin/env bash
# Pre-load review context for the /review slash command.
#
# Usage:
#   load-reference.sh                 # local mode: dump working-tree state and branch-vs-default summary
#   load-reference.sh <pr-number>     # PR mode: gh pr view + diff stat + checks
#   load-reference.sh <pr-url>        # PR mode (URL form)
#   load-reference.sh <branch-name>   # branch mode: diff stat vs default branch
#
# Output is bounded to a summary; the agent should fetch full diffs on demand
# (e.g. `gh pr diff <ref>` or `git diff <default>...<ref>`).
#
# Read-only: never mutates working-tree, refs, or remotes.

set -u

ref="${1:-}"

default_branch() {
  # Try the symbolic ref first; fall back to common names; print empty on failure.
  local b
  b="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  if [ -n "$b" ]; then
    printf '%s\n' "$b"
    return 0
  fi
  for cand in origin/main origin/master main master; do
    if git rev-parse --verify --quiet "$cand" >/dev/null 2>&1; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  return 1
}

is_pr_ref() {
  case "$1" in
    ''|*[!0-9]*) ;;
    *) return 0 ;;  # all-digits → PR number
  esac
  case "$1" in
    *github.com/*/pull/*) return 0 ;;
  esac
  return 1
}

mode=""
if [ -z "$ref" ]; then
  mode="local"
elif is_pr_ref "$ref"; then
  mode="pr"
else
  mode="branch"
fi

printf '## Mode: %s\n\n' "$mode"

case "$mode" in
  local)
    printf '### git status\n```\n'
    git status --short --branch 2>&1 || true
    printf '```\n\n'

    printf '### Staged changes (diff --cached --stat)\n```\n'
    git diff --cached --stat 2>&1 || true
    printf '```\n\n'

    printf '### Unstaged changes (diff --stat)\n```\n'
    git diff --stat 2>&1 || true
    printf '```\n\n'

    printf '### Untracked files\n```\n'
    git ls-files --others --exclude-standard 2>&1 || true
    printf '```\n\n'

    db="$(default_branch || true)"
    if [ -n "$db" ]; then
      printf '### Branch vs default (%s...HEAD --stat)\n```\n' "$db"
      git diff --stat "$db"...HEAD 2>&1 || true
      printf '```\n\n'
      printf '### Recent commits on branch\n```\n'
      git log --oneline --decorate -n 20 "$db"..HEAD 2>&1 || true
      printf '```\n'
    else
      printf '### Default branch\nCould not determine; ask the user or assume `origin/main`.\n'
    fi
    ;;

  pr)
    if ! command -v gh >/dev/null 2>&1; then
      printf 'gh CLI not found; cannot preload PR context. Ask the user to run `gh auth login` or paste the PR diff manually.\n'
      exit 0
    fi
    if ! gh auth status >/dev/null 2>&1; then
      printf 'gh CLI is not authenticated; cannot preload PR context. Ask the user to run `gh auth login`.\n'
      exit 0
    fi

    printf '### gh pr view %s\n```\n' "$ref"
    gh pr view "$ref" --json number,title,body,baseRefName,headRefName,author,state,isDraft,additions,deletions,changedFiles,url 2>&1 || true
    printf '```\n\n'

    printf '### Changed files\n```\n'
    gh pr diff "$ref" --name-only 2>&1 || true
    printf '```\n\n'

    printf '### CI checks\n```\n'
    gh pr checks "$ref" 2>&1 || true
    printf '```\n\n'

    printf '_Full diff not preloaded (size). Run `gh pr diff %s` on demand._\n' "$ref"
    ;;

  branch)
    db="$(default_branch || true)"
    if [ -z "$db" ]; then
      printf 'Could not determine default branch. Ask the user, or assume `origin/main`.\n'
      exit 0
    fi
    if ! git rev-parse --verify --quiet "$ref" >/dev/null 2>&1; then
      printf 'Branch `%s` not found locally. Try `git fetch origin %s` first, or pass `origin/%s`.\n' "$ref" "$ref" "$ref"
      exit 0
    fi

    printf '### Comparing %s...%s\n\n' "$db" "$ref"

    printf '### Merge base\n```\n'
    git merge-base "$db" "$ref" 2>&1 || true
    printf '```\n\n'

    printf '### Diff stat\n```\n'
    git diff --stat "$db"..."$ref" 2>&1 || true
    printf '```\n\n'

    printf '### Changed files\n```\n'
    git diff --name-only "$db"..."$ref" 2>&1 || true
    printf '```\n\n'

    printf '### Commits on branch\n```\n'
    git log --oneline --decorate "$db".."$ref" 2>&1 || true
    printf '```\n\n'

    printf '_Full diff not preloaded. Run `git diff %s...%s` on demand._\n' "$db" "$ref"
    ;;
esac
