#!/usr/bin/env bash
# prepare-pages.sh — Copy repo into a clean dir for GitHub Pages artifact
# Excludes sensitive files, dev artifacts, and non-frontend code.
# Prints the prepared dir path on stdout.

set -euo pipefail

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

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

echo "$TMP"
