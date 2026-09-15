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
# Use python instead of sed because source index.html has CRLF line endings
# (Windows-authored), and GNU sed's CRLF handling across platforms is
# unreliable. python reads/writes bytes correctly.
SUBPATH="/failurelogic/"
if command -v git >/dev/null 2>&1; then
    REMOTE_REPO=$(git -C "$(dirname "$0")/.." remote get-url origin 2>/dev/null | sed -E 's|.*[:/]([^/]+)/([^/]+)(\.git)?$|\2|')
    if [ -n "$REMOTE_REPO" ]; then
        SUBPATH="/$(echo "$REMOTE_REPO" | tr '[:upper:]' '[:lower:]')/"
    fi
fi
echo "GitHub Pages base href: $SUBPATH" >&2

if [ -f "$TMP/index.html" ]; then
    python3 - "$TMP/index.html" "$SUBPATH" <<'PYEOF'
import re, sys
path, subpath = sys.argv[1], sys.argv[2]
with open(path, 'rb') as f:
    content = f.read()
new_tag = f'<base id="gh-pages-base" href="{subpath}">'.encode('utf-8')
if b'<base id="gh-pages-base"' in content:
    content = re.sub(rb'<base id="gh-pages-base"[^>]*>', new_tag, content)
elif b'</title>' in content:
    content = content.replace(b'</title>', b'</title>\n    ' + new_tag, 1)
elif b'<head>' in content:
    content = content.replace(b'<head>', b'<head>\n    ' + new_tag, 1)
else:
    print(f'WARN: {path} has no <head> tag; cannot inject base href', file=sys.stderr)
    sys.exit(0)
with open(path, 'wb') as f:
    f.write(content)
print(f'  Injected <base href="{subpath}"> into {path}', file=sys.stderr)
PYEOF
fi

# SPA fallback: GitHub Pages serves 404.html for any path that doesn't
# match a static file. Replace 404.html with a copy of index.html so the
# SPA can bootstrap from any URL. The <base> tag injected above makes the
# relative URLs resolve correctly.
if [ -f "$TMP/index.html" ]; then
    cp "$TMP/index.html" "$TMP/404.html"
    echo "  SPA fallback: 404.html replaced with index.html copy" >&2
fi

# Also rewrite any links to the bare 404.html (e.g., manifest references)
# that might point to the now-overwritten file. Skip — Pages doesn't care.

echo "$TMP"
