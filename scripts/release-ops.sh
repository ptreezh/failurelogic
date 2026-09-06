#!/usr/bin/env bash
# release-ops.sh - Versioned releases for AI agents.
# Bash counterpart to scripts/release-ops.ps1.
#
# Subcommands:
#   notes [--since TAG] [--limit N] [--format oneline|json]
#       List commits since the given tag (default: most recent tag, or HEAD
#       if no tags exist).
#
#   tag --version V [--message "..."] [--push] [--dry-run]
#       Create an annotated git tag.
#
#   release --version V [--title "..."] [--notes-file PATH] [--draft] [--dry-run]
#       Create a GitHub release for the given tag.
#
# Setup:
#   Tagging works without tokens. For `release`, run:
#     ./scripts/git-platform-ops.sh auth-gh
#   first, or ensure GH_TOKEN is in .git-token.

set -euo pipefail

# ---- Defaults ----------------------------------------------------------------
VERSION=""
MESSAGE=""
SINCE=""
NOTES_FILE=""
LIMIT=20
FORMAT="oneline"
TITLE=""
PUSH=0
DRAFT=0
DRY_RUN=0
REMOTE="origin"
TOKEN_FILE=".git-token"

usage() {
    sed -n '2,30p' "$0"
    exit "${1:-0}"
}

# ---- Parse args --------------------------------------------------------------
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then usage 0; fi
if [[ $# -lt 1 ]]; then usage 1; fi
ACTION="$1"; shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)    VERSION="$2"; shift 2 ;;
        --message|-m) MESSAGE="$2"; shift 2 ;;
        --since)      SINCE="$2"; shift 2 ;;
        --limit)      LIMIT="$2"; shift 2 ;;
        --format)     FORMAT="$2"; shift 2 ;;
        --title)      TITLE="$2"; shift 2 ;;
        --notes-file) NOTES_FILE="$2"; shift 2 ;;
        --push)       PUSH=1; shift ;;
        --draft)      DRAFT=1; shift ;;
        --dry-run)    DRY_RUN=1; shift ;;
        --remote)     REMOTE="$2"; shift 2 ;;
        --token-file) TOKEN_FILE="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; usage 1 ;;
    esac
done

# Pick a working Python: try python3, fall back to python.
PYTHON="$(command -v python3 2>/dev/null || command -v python 2>/dev/null || echo "")"

# ---- Helpers -----------------------------------------------------------------
check_semver() {
    local v="${1#v}"  # strip leading v
    if [[ ! "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$ ]]; then
        echo "Version '$1' is not valid semver (expected: X.Y.Z or vX.Y.Z)" >&2
        exit 1
    fi
}

get_last_tag() {
    git describe --tags --abbrev=0 2>/dev/null || echo ""
}

get_notes_since() {
    local since="$1" limit="$2" format="$3"
    local raw
    if [[ -n "$since" ]]; then
        raw="$(git log "$since..HEAD" --pretty=format:'%H|%h|%an|%ae|%s|%ai' -n "$limit")"
    else
        raw="$(git log -n "$limit" --pretty=format:'%H|%h|%an|%ae|%s|%ai')"
    fi
    if [[ "$format" == "json" ]]; then
        if [[ -z "$PYTHON" ]]; then
            echo "[]"  # no python available, return empty JSON
            return
        fi
        echo "$raw" | "$PYTHON" -c "
import json, sys
out = []
for line in sys.stdin:
    parts = line.rstrip('\n').split('|', 5)
    if len(parts) == 6:
        out.append({
            'sha': parts[0], 'short': parts[1],
            'author': parts[2], 'email': parts[3],
            'subject': parts[4], 'date': parts[5],
        })
print(json.dumps(out, ensure_ascii=False))
"
    else
        echo "$raw" | awk -F'|' '{print $2, $5}'  # short sha + subject
    fi
}

load_gh_token() {
    if [[ ! -f "$TOKEN_FILE" ]]; then
        echo "Token file not found: $TOKEN_FILE" >&2
        echo "Run: cp .git-token.example $TOKEN_FILE" >&2
        exit 1
    fi
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        value="${value%\'}"; value="${value#\'}"
        value="${value%\"}"; value="${value#\"}"
        export "$key=$value"
    done < "$TOKEN_FILE"
    if [[ -z "${GH_TOKEN:-}" ]]; then
        echo "GH_TOKEN is empty in $TOKEN_FILE" >&2
        exit 1
    fi
}

# ---- Actions -----------------------------------------------------------------
case "$ACTION" in

    notes)
        since="$(get_last_tag)"
        if [[ -z "$since" ]]; then
            echo "(no previous tags; showing last $LIMIT commits)" >&2
        else
            echo "Commits since $since:" >&2
        fi
        get_notes_since "$since" "$LIMIT" "$FORMAT"
        ;;

    tag)
        if [[ -z "$VERSION" ]]; then
            echo "--version required" >&2; exit 1
        fi
        check_semver "$VERSION"
        full_tag="v${VERSION#v}"

        if git rev-parse -q --verify "refs/tags/$full_tag" >/dev/null; then
            echo "Tag '$full_tag' already exists. Use a different version or delete it first." >&2
            exit 1
        fi

        msg="${MESSAGE:-Release $full_tag}"
        if (( DRY_RUN )); then
            echo "[dry-run] git tag -a $full_tag -m '$msg'" >&2
            if (( PUSH )); then
                echo "[dry-run] git push $REMOTE $full_tag" >&2
            fi
            exit 0
        fi
        git tag -a "$full_tag" -m "$msg"
        echo "Created tag $full_tag"
        if (( PUSH )); then
            echo ">>> git push $REMOTE $full_tag" >&2
            git push "$REMOTE" "$full_tag"
            echo "Pushed $full_tag to $REMOTE"
        fi
        ;;

    release)
        if [[ -z "$VERSION" ]]; then
            echo "--version required" >&2; exit 1
        fi
        check_semver "$VERSION"
        full_tag="v${VERSION#v}"

        if ! command -v gh >/dev/null 2>&1; then
            echo "gh CLI not installed. Install: https://cli.github.com" >&2
            exit 1
        fi
        load_gh_token
        # `gh auth login --with-token` may print warnings to stderr about GH_TOKEN
        # being set in the environment. We redirect both streams so the script
        # doesn't choke on set -e.
        echo "$GH_TOKEN" | gh auth login --with-token >/dev/null 2>&1 || true

        # Create tag if missing
        if ! git rev-parse -q --verify "refs/tags/$full_tag" >/dev/null; then
            msg="${MESSAGE:-Release $full_tag}"
            if (( DRY_RUN )); then
                echo "[dry-run] git tag -a $full_tag -m '$msg'" >&2
            else
                git tag -a "$full_tag" -m "$msg"
                echo "Created tag $full_tag"
            fi
        fi

        # Push tag if not on remote
        if (( DRY_RUN )); then
            echo "[dry-run] git push $REMOTE $full_tag" >&2
        else
            if ! git ls-remote --tags "$REMOTE" "$full_tag" 2>/dev/null | grep -q .; then
                git push "$REMOTE" "$full_tag" >&2
                echo "Pushed $full_tag to $REMOTE"
            fi
        fi

        # Notes: use file if provided, else generate from prev tag
        notes_path="$NOTES_FILE"
        if [[ -z "$notes_path" ]]; then
            notes_path="$(mktemp)"
            trap "rm -f '$notes_path'" EXIT
            # Find second-most-recent tag (the one before this release)
            prev_tag=$(git tag -l 'v*.*.*' --sort=-version:refname | grep -v "^${full_tag}$" | head -1 || true)
            if [[ -z "$prev_tag" ]]; then
                echo "(no previous tag; using last $LIMIT commits)" >&2
                get_notes_since "" "$LIMIT" "oneline" > "$notes_path"
            else
                get_notes_since "$prev_tag" "$LIMIT" "oneline" > "$notes_path"
            fi
        fi

        title_arg=(--title "${TITLE:-Release $full_tag}")
        draft_arg=()
        (( DRAFT )) && draft_arg=(--draft)

        if (( DRY_RUN )); then
            echo "[dry-run] gh release create $full_tag --notes-file $notes_path ${title_arg[*]} ${draft_arg[*]}" >&2
            exit 0
        fi

        echo ">>> gh release create $full_tag" >&2
        gh release create "$full_tag" --notes-file "$notes_path" "${title_arg[@]}" "${draft_arg[@]}"
        echo "Released $full_tag"
        ;;

    *) echo "Unknown action: $ACTION" >&2; usage 1 ;;
esac
