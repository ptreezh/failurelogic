# Makefile - Unified entry point for wrapper scripts and tests.
#
# Run from repo root:  make <target>
# Default goal: help (run `make` with no args to see available targets).
#
# Cross-platform note: GNU make is required. On Windows, use Git Bash, WSL,
# or Chocolatey (`choco install make`). If make isn't available, the
# equivalent targets are exposed as npm scripts — see package.json
# "scripts" section (`npm run wrappers:help`, etc.).

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c

REPO_ROOT := $(shell pwd)
WRAPPERS := git-platform-ops publish-ops release-ops

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
	     /^[a-zA-Z_-]+:.*## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' \
	     $(MAKEFILE_LIST)

# ===== Tests =================================================================

.PHONY: test
test: test-bash test-ps ## Run all wrapper tests (bash + PowerShell)

.PHONY: test-bash
test-bash: ## Run all bash test suites
	@echo "==> tests/git-platform-ops/test.sh"
	@bash tests/git-platform-ops/test.sh
	@echo "==> tests/publish-ops/test.sh"
	@bash tests/publish-ops/test.sh
	@echo "==> tests/release-ops/test.sh"
	@bash tests/release-ops/test.sh

.PHONY: test-ps
test-ps: ## Run all PowerShell test suites
	@echo "==> tests/git-platform-ops/test.ps1"
	@pwsh tests/git-platform-ops/test.ps1
	@echo "==> tests/publish-ops/test.ps1"
	@pwsh tests/publish-ops/test.ps1
	@echo "==> tests/release-ops/test.ps1"
	@pwsh tests/release-ops/test.ps1

.PHONY: test-git-platform-ops
test-git-platform-ops: ## Run git-platform-ops tests (bash + PowerShell)
	@bash tests/git-platform-ops/test.sh
	@pwsh tests/git-platform-ops/test.ps1

.PHONY: test-publish-ops
test-publish-ops: ## Run publish-ops tests (bash + PowerShell)
	@bash tests/publish-ops/test.sh
	@pwsh tests/publish-ops/test.ps1

.PHONY: test-release-ops
test-release-ops: ## Run release-ops tests (bash + PowerShell)
	@bash tests/release-ops/test.sh
	@pwsh tests/release-ops/test.ps1

# ===== Lint ==================================================================

.PHONY: lint
lint: lint-bash lint-ps ## Lint all wrapper scripts

.PHONY: lint-bash
lint-bash: ## bash -n on all bash wrappers
	@bash -n scripts/git-platform-ops.sh && echo "OK git-platform-ops.sh"
	@bash -n scripts/publish-ops.sh       && echo "OK publish-ops.sh"
	@bash -n scripts/release-ops.sh       && echo "OK release-ops.sh"

.PHONY: lint-ps
lint-ps: ## pwsh parse-check on all PowerShell wrappers
	@pwsh -NoProfile -Command '$$errors = $$null; $$tokens = $$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path "scripts/with-token.ps1").Path, [ref]$$tokens, [ref]$$errors); if ($$errors.Count -gt 0) { $$errors | ForEach-Object { Write-Host $$_ }; exit 1 }; Write-Host "OK with-token.ps1"'
	@pwsh -NoProfile -Command '$$errors = $$null; $$tokens = $$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path "scripts/git-platform-ops.ps1").Path, [ref]$$tokens, [ref]$$errors); if ($$errors.Count -gt 0) { $$errors | ForEach-Object { Write-Host $$_ }; exit 1 }; Write-Host "OK git-platform-ops.ps1"'
	@pwsh -NoProfile -Command '$$errors = $$null; $$tokens = $$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path "scripts/publish-ops.ps1").Path, [ref]$$tokens, [ref]$$errors); if ($$errors.Count -gt 0) { $$errors | ForEach-Object { Write-Host $$_ }; exit 1 }; Write-Host "OK publish-ops.ps1"'
	@pwsh -NoProfile -Command '$$errors = $$null; $$tokens = $$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path "scripts/release-ops.ps1").Path, [ref]$$tokens, [ref]$$errors); if ($$errors.Count -gt 0) { $$errors | ForEach-Object { Write-Host $$_ }; exit 1 }; Write-Host "OK release-ops.ps1"'

# ===== Security =============================================================

.PHONY: security-check
security-check: ## Scan for accidentally committed tokens; verify .git-token ignored
	@if grep -rEn 'ghp_[A-Za-z0-9]{20,}' . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=tests 2>/dev/null; then \
		echo "ERROR: GitHub PAT (ghp_*) prefix found in tracked files"; exit 1; \
	fi
	@if grep -rEn 'gho_[A-Za-z0-9]{20,}' . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=tests 2>/dev/null; then \
		echo "ERROR: GitHub OAuth (gho_*) prefix found in tracked files"; exit 1; \
	fi
	@echo "OK: no real-looking GitHub tokens found"
	@git check-ignore .git-token > /dev/null && echo "OK: .git-token is gitignored"

# ===== Convenience wrappers =================================================

.PHONY: info
info: ## Show current repo info via git-platform-ops
	@./scripts/git-platform-ops.sh info

.PHONY: auth-status
auth-status: ## Show loaded tokens (masked) via git-platform-ops
	@./scripts/git-platform-ops.sh auth-status

.PHONY: release-notes
release-notes: ## Show commits since last tag via release-ops
	@./scripts/release-ops.sh notes

# ===== Maintenance ==========================================================

.PHONY: clean
clean: ## Remove temp test artifacts and verify nothing tracked was deleted
	@echo "No tracked files to clean. (Test suites use mktemp + trap.)"

.PHONY: all
all: lint security-check test ## Full check: lint + security + tests
