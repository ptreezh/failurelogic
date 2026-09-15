#!/usr/bin/env bash
# prepare-pages.sh — Copy repo into a clean dir for GitHub Pages artifact
# Excludes sensitive files, dev artifacts, and non-frontend code.
# Prints the prepared dir path on stdout.

set -euo pipefail

TMP=$(mktemp -d)
# NOTE: no `trap ... EXIT` here — the GitHub Actions workflow reads
# ARTIFACT_DIR after this script returns and needs the directory intact.
# The runner's /tmp is wiped between jobs anyway.

# Copy into temp dir, excluding everything that shouldn't ship to Pages.
rsync -a \
    --exclude='.git' \
    --exclude='.github' \
    --exclude='.gitignore' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='.kode-config.json' \
    --exclude='.kode-config.*.json' \
    --exclude='.vscode' \
    --exclude='.devcontainer' \
    --exclude='.kilo' \
    --exclude='.qwen' \
    --exclude='.planning' \
    --exclude='.pytest_cache' \
    --exclude='.ruff_cache' \
    --exclude='archived-scenarios' \
    --exclude='api-server' \
    --exclude='tests' \
    --exclude='scripts' \
    --exclude='research' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.backup' \
    --exclude='*.backup' \
    --exclude='*.py' \
    --exclude='*.pyc' \
    --exclude='*.toml' \
    --exclude='*.yaml' \
    --exclude='*.yml' \
    --exclude='*.json' \
    --exclude='*.log' \
    --exclude='*.md' \
    --exclude='*.txt' \
    --exclude='*.sh' \
    --exclude='*.ps1' \
    --exclude='*.bat' \
    --exclude='Procfile' \
    --exclude='Dockerfile' \
    --exclude='render.yaml' \
    --exclude='railway.toml' \
    --exclude='railway.json' \
    --exclude='vercel.json' \
    --exclude='nixpacks.toml' \
    --exclude='package.json' \
    --exclude='package-lock.json' \
    --exclude='static-server.js' \
    --exclude='.nojekyll' \
    --exclude='favicon.ico' \
    ./ "$TMP/"

# Inject <base href="/failurelogic/"> into deployed index.html so the SPA's
# relative URLs (window.history.pushState('/scenarios'), asset paths, etc.)
# resolve correctly under the GitHub Pages subpath. Source index.html is
# untouched — local dev (served at /) is unaffected.
#
# Detect subpath from git remote if available; fall back to hardcoded value.
SUBPATH="/failurelogic/"
if command -v git >/dev/null 2>&1; then
    REMOTE_REPO=$(git -C "$(dirname "$0")/.." remote get-url origin 2>/dev/null | sed -E 's|.*[:/]([^/]+)/([^/]+)(\.git)?$|\2|')
    if [ -n "$REMOTE_REPO" ]; then
        SUBPATH="/$(echo "$REMOTE_REPO" | tr '[:upper:]' '[:lower:]')/"
    fi
fi
echo "GitHub Pages base href: $SUBPATH" >&2

if [ -f "$TMP/index.html" ]; then
    # Idempotent: replace existing <base> or inject after <title>
    if grep -q '<base id="gh-pages-base"' "$TMP/index.html"; then
        sed -i "s|<base id=\"gh-pages-base\"[^>]*>|<base id=\"gh-pages-base\" href=\"$SUBPATH\">|" "$TMP/index.html"
    elif grep -q '</title>' "$TMP/index.html"; then
        sed -i "s|</title>|</title>\n    <base id=\"gh-pages-base\" href=\"$SUBPATH\">|" "$TMP/index.html"
    else
        sed -i "s|<head>|<head>\n    <base id=\"gh-pages-base\" href=\"$SUBPATH\">|" "$TMP/index.html"
    fi
fi

echo "$TMP"
