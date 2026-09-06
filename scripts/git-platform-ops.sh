#!/usr/bin/env bash
# git-platform-ops.sh - Authenticated GitHub/Gitee operations for AI agents.
# Bash counterpart to scripts/git-platform-ops.ps1. Same subcommands, same
# security model (loads .git-token, never echoes secrets).
#
# Usage:
#   ./scripts/git-platform-ops.sh info
#   ./scripts/git-platform-ops.sh auth-status
#   ./scripts/git-platform-ops.sh auth-gh
#   ./scripts/git-platform-ops.sh push [--branch X]
#   ./scripts/git-platform-ops.sh pr-create --title "..." --body "..." [--base main]
#   ./scripts/git-platform-ops.sh pr-list [--limit N]
#   ./scripts/git-platform-ops.sh pr-status --number N
#   ./scripts/git-platform-ops.sh pr-wait --number N [--timeout 600]
#   ./scripts/git-platform-ops.sh issue-create --title "..." --body "..."
#   ./scripts/git-platform-ops.sh issue-list [--limit N]
#
# Dependencies: bash 4+, curl, python3 (for JSON), gh (optional, GitHub only).

set -euo pipefail

# ---- Defaults ----------------------------------------------------------------
TOKEN_FILE=".git-token"
REMOTE="origin"
BRANCH=""
TITLE=""
BODY=""
BASE=""
NUMBER=""
LIMIT=10
TIMEOUT=600

# ---- Usage -------------------------------------------------------------------
usage() {
    sed -n '2,30p' "$0"
    exit "${1:-0}"
}

# ---- Parse args --------------------------------------------------------------
# Handle --help / -h as first positional (before ACTION assignment).
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then usage 0; fi
if [[ $# -lt 1 ]]; then usage 1; fi
ACTION="$1"; shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        --remote)     REMOTE="$2"; shift 2 ;;
        --branch)     BRANCH="$2"; shift 2 ;;
        --title)      TITLE="$2"; shift 2 ;;
        --body)       BODY="$2"; shift 2 ;;
        --base)       BASE="$2"; shift 2 ;;
        --number)     NUMBER="$2"; shift 2 ;;
        --limit)      LIMIT="$2"; shift 2 ;;
        --timeout)    TIMEOUT="$2"; shift 2 ;;
        --token-file) TOKEN_FILE="$2"; shift 2 ;;
        -h|--help)    usage 0 ;;
        *) echo "Unknown arg: $1" >&2; usage 1 ;;
    esac
done

# ---- Helpers -----------------------------------------------------------------
mask() {
    local v="$1"
    [[ -z "$v" || ${#v} -le 8 ]] && { echo "***"; return; }
    echo "${v:0:4}***${v: -4}"
}

get_remote_url() {
    git remote get-url "$REMOTE" 2>/dev/null \
        || { echo "Cannot read remote '$REMOTE'. Run inside a git repo." >&2; exit 1; }
}

get_platform() {
    case "$1" in
        *github.com*) echo github ;;
        *gitee.com*)  echo gitee  ;;
        *) echo "Unsupported platform in remote URL: $1" >&2; exit 1 ;;
    esac
}

get_owner_repo() {
    # Matches https://host/owner/repo(.git) and git@host:owner/repo(.git)
    local url="$1"
    if [[ "$url" =~ ([:/])([^/]+)/([^/]+)/?$ ]]; then
        local repo="${BASH_REMATCH[3]%.git}"  # strip .git suffix
        echo "${BASH_REMATCH[2]} $repo"
    else
        echo "Cannot parse owner/repo from: $url" >&2; exit 1
    fi
}

require_token() {
    local var="$1"
    if [[ -z "${!var:-}" ]]; then
        echo "$var is empty in $TOKEN_FILE. Check your token file." >&2
        exit 1
    fi
}

# Build JSON from key=value pairs using python3 (avoids jq dependency).
build_json() {
    python3 - "$@" <<'PY'
import json, sys
obj = {}
for kv in sys.argv[1:]:
    if "=" not in kv: continue
    k, v = kv.split("=", 1)
    obj[k] = v
print(json.dumps(obj, ensure_ascii=False))
PY
}

# HTTP helper. Sets METHOD, URL, optional BODY, and uses $1 as token env var name.
api_call() {
    local token_var="$1" method="$2" url="$3" body="${4:-}"
    local token="${!token_var}"
    require_token "$token_var"
    if [[ -n "$body" ]]; then
        curl -sS -X "$method" \
            -H "Authorization: token $token" \
            -H "Content-Type: application/json;charset=UTF-8" \
            -H "User-Agent: git-platform-ops" \
            -d "$body" "$url"
    else
        curl -sS -X "$method" \
            -H "Authorization: token $token" \
            -H "User-Agent: git-platform-ops" \
            "$url"
    fi
}

# ---- Token loading -----------------------------------------------------------
NEEDS_AUTH=0
case "$ACTION" in
    auth-status|auth-gh|push|pr-create|pr-list|pr-status|pr-wait|issue-create|issue-list) NEEDS_AUTH=1 ;;
esac

if [[ "$NEEDS_AUTH" == "1" ]]; then
    if [[ ! -f "$TOKEN_FILE" ]]; then
        echo "Token file not found: $TOKEN_FILE" >&2
        echo "Run: cp .git-token.example $TOKEN_FILE" >&2
        exit 1
    fi
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        # Strip surrounding quotes
        value="${value%\'}"; value="${value#\'}"
        value="${value%\"}"; value="${value#\"}"
        export "$key=$value"
    done < "$TOKEN_FILE"
fi

# ---- Actions -----------------------------------------------------------------
case "$ACTION" in
    auth-status)
        echo "Loaded from $TOKEN_FILE (values masked):"
        for n in GH_TOKEN GITEE_TOKEN; do
            v="${!n:-}"
            if [[ -n "$v" ]]; then
                echo "  $n = $(mask "$v")"
            else
                echo "  $n = (not set)"
            fi
        done
        ;;

    auth-gh)
        if ! command -v gh >/dev/null 2>&1; then
            echo "gh CLI not installed. Install: https://cli.github.com" >&2
            exit 1
        fi
        if [[ ! -f "$TOKEN_FILE" ]]; then
            echo "Token file not found: $TOKEN_FILE" >&2
            echo "Run: cp .git-token.example $TOKEN_FILE" >&2
            exit 1
        fi
        require_token GH_TOKEN
        echo "$GH_TOKEN" | gh auth login --with-token >/dev/null 2>&1 || true
        login=$(gh api user --jq '.login' 2>/dev/null || true)
        if [[ -n "$login" ]]; then
            echo "gh CLI authenticated as $login"
        else
            echo "gh CLI authentication completed"
        fi
        ;;

    info)
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"
        branch="$(git branch --show-current)"
        echo "Remote:    $REMOTE -> $url"
        echo "Platform:  $plat"
        echo "Owner:     $owner"
        echo "Repo:      $repo"
        echo "Branch:    $branch"
        ;;

    push)
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        branch="${BRANCH:-$(git branch --show-current)}"
        if [[ "$plat" == "github" ]]; then
            require_token GH_TOKEN
            auth_url="${url/#https:\/\//https://x-access-token:${GH_TOKEN}@}"
        else
            require_token GITEE_TOKEN
            auth_url="${url/#https:\/\//https://oauth2:${GITEE_TOKEN}@}"
        fi
        echo ">>> git push $REMOTE $branch" >&2
        git push "$auth_url" "$branch"
        ;;

    pr-create)
        [[ -n "$TITLE" ]] || { echo "--title required" >&2; exit 1; }
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"
        head="${BRANCH:-$(git branch --show-current)}"
        base="${BASE:-main}"

        if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
            gh pr create --title "$TITLE" --body "${BODY:-}" --base "$base" --head "$head" --repo "$owner/$repo"
        elif [[ "$plat" == "github" ]]; then
            json="$(build_json "title=$TITLE" "body=$BODY" "head=$head" "base=$base")"
            resp="$(curl -sS -X POST \
                -H "Authorization: Bearer $GH_TOKEN" \
                -H "Accept: application/vnd.github+json" \
                -H "X-GitHub-Api-Version: 2022-11-28" \
                -d "$json" \
                "https://api.github.com/repos/$owner/$repo/pulls")"
            echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('html_url','(no url)'))"
        else
            json="$(build_json "title=$TITLE" "body=$BODY" "head=$head" "base=$base" "source_branch=$head" "target_branch=$base")"
            resp="$(api_call GITEE_TOKEN POST "https://gitee.com/api/v5/repos/$owner/$repo/pulls" "$json")"
            echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('html_url','(no url)'))"
        fi
        ;;

    pr-list)
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"

        if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
            gh pr list --repo "$owner/$repo" --limit "$LIMIT"
        elif [[ "$plat" == "github" ]]; then
            curl -sS -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
                "https://api.github.com/repos/$owner/$repo/pulls?per_page=$LIMIT" \
                | python3 -c "
import json, sys
for p in json.load(sys.stdin):
    print(f\"#{p['number']} [{p['state']}] {p['title']} - {p['html_url']}\")
"
        else
            curl -sS -H "Authorization: token $GITEE_TOKEN" \
                "https://gitee.com/api/v5/repos/$owner/$repo/pulls?state=open&per_page=$LIMIT" \
                | python3 -c "
import json, sys
for p in json.load(sys.stdin):
    print(f\"#{p['number']} [{p['state']}] {p['title']} - {p['html_url']}\")
"
        fi
        ;;

    pr-status)
        [[ -n "$NUMBER" ]] || { echo "--number required" >&2; exit 1; }
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"

        if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
            gh pr view "$NUMBER" --repo "$owner/$repo" \
                --json state,title,mergeable,mergeStateStatus,statusCheckRollup,reviewDecision,url
        elif [[ "$plat" == "github" ]]; then
            curl -sS -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
                "https://api.github.com/repos/$owner/$repo/pulls/$NUMBER" \
                | python3 -c "
import json, sys
p = json.load(sys.stdin)
print(f\"PR #{p['number']}: {p['title']}\")
print(f\"  State:      {p['state']}\")
print(f\"  Mergeable:  {p['mergeable']}\")
print(f\"  URL:        {p['html_url']}\")
"
        else
            curl -sS -H "Authorization: token $GITEE_TOKEN" \
                "https://gitee.com/api/v5/repos/$owner/$repo/pulls/$NUMBER" \
                | python3 -c "
import json, sys
p = json.load(sys.stdin)
print(f\"PR #{p['number']}: {p['title']}\")
print(f\"  State:      {p['state']}\")
print(f\"  Mergeable:  {p.get('mergeable', 'n/a')}\")
print(f\"  URL:        {p['html_url']}\")
"
        fi
        ;;

    pr-wait)
        [[ -n "$NUMBER" ]] || { echo "--number required" >&2; exit 1; }
        (( TIMEOUT >= 10 )) || TIMEOUT=10
        interval=10
        elapsed=0
        attempt=0

        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"

        while (( elapsed < TIMEOUT )); do
            attempt=$((attempt + 1))

            if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
                pr_json="$(gh pr view "$NUMBER" --repo "$owner/$repo" \
                    --json mergeStateStatus,statusCheckRollup,reviewDecision)"
                state=$(echo "$pr_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('mergeStateStatus',''))")
                pending=$(echo "$pr_json" | python3 -c "
import json, sys
rollup = json.load(sys.stdin).get('statusCheckRollup') or []
print(sum(1 for c in rollup if c.get('conclusion') not in ('SUCCESS','SKIPPEN','NEUTRAL')))
")
                review=$(echo "$pr_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('reviewDecision') or '')")
                if [[ "$state" == "GREEN" && "$pending" == "0" && ( -z "$review" || "$review" == "APPROVED" ) ]]; then
                    echo "PR #$NUMBER is ready (attempt $attempt)"
                    exit 0
                fi
            else
                # Fallback: assume ready after polling once (no detailed checks)
                echo "[$attempt] polling PR #$NUMBER (next check in ${interval}s)"
                if (( attempt == 1 )); then
                    # Real check via curl
                    if [[ "$plat" == "github" ]]; then
                        ready=$(curl -sS -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
                            "https://api.github.com/repos/$owner/$repo/pulls/$NUMBER" \
                            | python3 -c "import json,sys; print(json.load(sys.stdin).get('mergeable', False))")
                    else
                        ready=$(curl -sS -H "Authorization: token $GITEE_TOKEN" \
                            "https://gitee.com/api/v5/repos/$owner/$repo/pulls/$NUMBER" \
                            | python3 -c "import json,sys; print(json.load(sys.stdin).get('mergeable', False))")
                    fi
                    if [[ "$ready" == "True" ]]; then
                        echo "PR #$NUMBER is mergeable (attempt $attempt)"
                        exit 0
                    fi
                fi
            fi

            echo "[$attempt] state=$state pending=$pending review=$review (next check in ${interval}s)"
            sleep "$interval"
            elapsed=$((elapsed + interval))
        done
        echo "Timed out after ${TIMEOUT}s waiting for PR #$NUMBER" >&2
        exit 1
        ;;

    issue-create)
        [[ -n "$TITLE" ]] || { echo "--title required" >&2; exit 1; }
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"

        if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
            gh issue create --title "$TITLE" --body "${BODY:-}" --repo "$owner/$repo"
        elif [[ "$plat" == "github" ]]; then
            json="$(build_json "title=$TITLE" "body=$BODY")"
            resp="$(curl -sS -X POST \
                -H "Authorization: Bearer $GH_TOKEN" \
                -H "Accept: application/vnd.github+json" \
                -d "$json" \
                "https://api.github.com/repos/$owner/$repo/issues")"
            echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('html_url','(no url)'))"
        else
            json="$(build_json "title=$TITLE" "body=$BODY")"
            resp="$(api_call GITEE_TOKEN POST "https://gitee.com/api/v5/repos/$owner/$repo/issues" "$json")"
            echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url','(no url)'))"
        fi
        ;;

    issue-list)
        url="$(get_remote_url)"
        plat="$(get_platform "$url")"
        read -r owner repo <<< "$(get_owner_repo "$url")"

        if [[ "$plat" == "github" ]] && command -v gh >/dev/null 2>&1; then
            gh issue list --repo "$owner/$repo" --limit "$LIMIT"
        elif [[ "$plat" == "github" ]]; then
            curl -sS -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
                "https://api.github.com/repos/$owner/$repo/issues?per_page=$LIMIT" \
                | python3 -c "
import json, sys
for i in json.load(sys.stdin):
    print(f\"#{i['number']} [{i['state']}] {i['title']} - {i['html_url']}\")
"
        else
            curl -sS -H "Authorization: token $GITEE_TOKEN" \
                "https://gitee.com/api/v5/repos/$owner/$repo/issues?state=open&per_page=$LIMIT" \
                | python3 -c "
import json, sys
for i in json.load(sys.stdin):
    print(f\"#{i['number']} [{i['state']}] {i['title']} - {i['html_url']}\")
"
        fi
        ;;

    *) echo "Unknown action: $ACTION" >&2; usage 1 ;;
esac
