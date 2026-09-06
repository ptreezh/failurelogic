#!/usr/bin/env bash
# publish-ops.sh - Authenticated package publishing for AI agents.
# Bash counterpart to scripts/publish-ops.ps1.
#
# Subcommands:
#   docker-build --image NAME [--tag VERSION] [--dockerfile PATH]
#       Build a Docker image. Defaults to latest tag and ./Dockerfile.
#
#   docker-push --image NAME [--tag VERSION]
#       Login to a registry (Docker Hub by default) and push.
#       Requires DOCKERHUB_USERNAME and DOCKERHUB_TOKEN in .git-token.
#
#   npm-publish [--tag VERSION] [--registry URL]
#       Publish an npm package. Requires NPM_TOKEN in .git-token.
#       Writes a temp userconfig that's removed on exit.
#
# Setup:
#   Add tokens to .git-token (see .git-token.example):
#     DOCKERHUB_USERNAME=your_user
#     DOCKERHUB_TOKEN=dckr_pat_xxx
#     NPM_TOKEN=npm_xxx

set -euo pipefail

# ---- Defaults ----------------------------------------------------------------
TOKEN_FILE=".git-token"
IMAGE=""
TAG="latest"
DOCKERFILE="Dockerfile"
REGISTRY="docker.io"
NPM_REGISTRY="https://registry.npmjs.org"

# ---- Usage -------------------------------------------------------------------
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
        --image)      IMAGE="$2"; shift 2 ;;
        --tag)        TAG="$2"; shift 2 ;;
        --dockerfile) DOCKERFILE="$2"; shift 2 ;;
        --registry)   REGISTRY="$2"; shift 2 ;;
        --npm-registry) NPM_REGISTRY="$2"; shift 2 ;;
        --token-file) TOKEN_FILE="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; usage 1 ;;
    esac
done

# ---- Helpers -----------------------------------------------------------------
require_token() {
    local var="$1"
    if [[ -z "${!var:-}" ]]; then
        echo "$var is empty in $TOKEN_FILE. Add it to your token file." >&2
        exit 1
    fi
}

# ---- Token loading -----------------------------------------------------------
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

# ---- Actions -----------------------------------------------------------------
case "$ACTION" in

    docker-build)
        [[ -n "$IMAGE" ]] || { echo "--image required" >&2; exit 1; }
        [[ -f "$DOCKERFILE" ]] || { echo "Dockerfile not found: $DOCKERFILE" >&2; exit 1; }
        if [[ "$IMAGE" == */* ]]; then
            full_tag="${IMAGE}:${TAG}"
        else
            full_tag="${REGISTRY}/${IMAGE}:${TAG}"
        fi
        echo ">>> docker build -t $full_tag -f $DOCKERFILE ." >&2
        docker build -t "$full_tag" -f "$DOCKERFILE" .
        echo "Built $full_tag"
        ;;

    docker-push)
        [[ -n "$IMAGE" ]] || { echo "--image required" >&2; exit 1; }
        require_token DOCKERHUB_USERNAME
        require_token DOCKERHUB_TOKEN
        if [[ "$IMAGE" == */* ]]; then
            full_tag="${IMAGE}:${TAG}"
        else
            full_tag="${REGISTRY}/${IMAGE}:${TAG}"
        fi

        # --password-stdin keeps token out of `ps` output.
        echo ">>> docker login $REGISTRY (user: $DOCKERHUB_USERNAME)" >&2
        echo "$DOCKERHUB_TOKEN" | docker login "$REGISTRY" --username "$DOCKERHUB_USERNAME" --password-stdin
        echo ">>> docker push $full_tag" >&2
        docker push "$full_tag"
        echo "Pushed $full_tag"
        ;;

    npm-publish)
        [[ -f "package.json" ]] || { echo "package.json not found. Run from a Node.js project root." >&2; exit 1; }
        require_token NPM_TOKEN

        # Use a temp userconfig so we never touch the project's .npmrc.
        userconfig="$(mktemp)"
        trap "rm -f '$userconfig'" EXIT
        cat > "$userconfig" <<EOF
;registry=$NPM_REGISTRY/
//$NPM_REGISTRY/:_authToken=$NPM_TOKEN
EOF

        echo ">>> npm publish --tag $TAG --userconfig $userconfig" >&2
        npm publish --tag "$TAG" --userconfig "$userconfig" --registry "$NPM_REGISTRY"
        echo "Published to $NPM_REGISTRY with tag $TAG"
        ;;

    *) echo "Unknown action: $ACTION" >&2; usage 1 ;;
esac
