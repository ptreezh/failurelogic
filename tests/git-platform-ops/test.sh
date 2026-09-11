#!/usr/bin/env bash
# test.sh - Smoke tests for scripts/git-platform-ops.sh
#
# No external dependencies (no bats, no jq, no python). Pure bash with
# assert helpers. Exit code = number of failures.
#
# Run from repo root:  bash tests/git-platform-ops/test.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WRAPPER="$REPO_ROOT/scripts/git-platform-ops.sh"

if [[ ! -x "$WRAPPER" ]]; then
    echo "FAIL  wrapper not found or not executable: $WRAPPER" >&2
    exit 1
fi

PASS=0; FAIL=0
TEMP_FILES=()
cleanup() { rm -f "${TEMP_FILES[@]:-}"; }
trap cleanup EXIT

assert_eq() {
    local desc="$1" actual="$2" expected="$3"
    if [[ "$actual" == "$expected" ]]; then
        echo "PASS  $desc"
        ((PASS++))
    else
        echo "FAIL  $desc"
        echo "      expected: $expected"
        echo "      actual:   $actual"
        ((FAIL++))
    fi
}

assert_contains() {
    local desc="$1" haystack="$2" needle="$3"
    if [[ "$haystack" == *"$needle"* ]]; then
        echo "PASS  $desc"
        ((PASS++))
    else
        echo "FAIL  $desc"
        echo "      expected to contain: $needle"
        echo "      actual:              $haystack"
        ((FAIL++))
    fi
}

# Write a token file. $1 = include trailing newline (1) or not (0).
make_token_file() {
    local f; f="$(mktemp)"
    TEMP_FILES+=("$f")
    if [[ "$1" == "1" ]]; then
        printf 'GH_TOKEN=ghp_test1234567890abcdefgh\nGITEE_TOKEN=test1234567890abcdef\n' > "$f"
    else
        printf 'GH_TOKEN=ghp_test1234567890abcdefgh\nGITEE_TOKEN=test1234567890abcdef' > "$f"
    fi
    echo "$f"
}

echo "=== test.sh: git-platform-ops.sh ==="
echo ""

# ---- T1: info action --------------------------------------------------------
out="$(cd "$REPO_ROOT" && "$WRAPPER" info 2>&1)"
assert_contains "info shows platform"     "$out" "Platform:  github"
assert_contains "info shows owner"        "$out" "Owner:     ptreezh"
assert_contains "info shows repo (no .git suffix)" "$out" "Repo:      failurelogic"
# The "Repo:" line must not contain .git (the remote URL line is allowed to).
repo_line="$(grep '^Repo:' <<< "$out" || true)"
if [[ "$repo_line" == *".git"* ]]; then
    echo "FAIL  Repo: line should strip .git suffix"
    echo "      actual: $repo_line"
    ((FAIL++))
else
    echo "PASS  info strips .git suffix from Repo: line"
    ((PASS++))
fi

# ---- T2: auth-status with trailing newline ----------------------------------
tf="$(make_token_file 1)"
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file "$tf" 2>&1)"
assert_contains "auth-status masks GH_TOKEN"   "$out" "GH_TOKEN = ghp_***efgh"
assert_contains "auth-status masks GITEE_TOKEN" "$out" "GITEE_TOKEN = test***cdef"

# ---- T3: regression - token file WITHOUT trailing newline ------------------
# Previously, bash `read` exited early at EOF on a no-newline last line,
# causing GITEE_TOKEN to never load. This guards against regression.
tf="$(make_token_file 0)"
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file "$tf" 2>&1)"
assert_contains "auth-status loads GITEE_TOKEN without trailing newline" \
    "$out" "GITEE_TOKEN = test***cdef"

# ---- T4: auth-status missing file -------------------------------------------
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file /tmp/__nonexistent_token_file_$$ 2>&1 || true)"
assert_contains "auth-status errors when file missing" "$out" "Token file not found"
assert_contains "auth-status error mentions setup command" "$out" "cp .git-token.example"

# ---- T5: unknown action -----------------------------------------------------
out="$(cd "$REPO_ROOT" && "$WRAPPER" bogus-action 2>&1 || true)"
assert_contains "unknown action errors helpfully" "$out" "Unknown action"

# ---- T6: required args ------------------------------------------------------
# Token loading runs first; provide a token file so we get to the arg check.
tf="$(make_token_file 1)"
out="$(cd "$REPO_ROOT" && "$WRAPPER" pr-create --token-file "$tf" 2>&1 || true)"
assert_contains "pr-create requires --title" "$out" "--title required"
out="$(cd "$REPO_ROOT" && "$WRAPPER" issue-create --token-file "$tf" 2>&1 || true)"
assert_contains "issue-create requires --title" "$out" "--title required"
out="$(cd "$REPO_ROOT" && "$WRAPPER" pr-status --token-file "$tf" 2>&1 || true)"
assert_contains "pr-status requires --number" "$out" "--number required"
out="$(cd "$REPO_ROOT" && "$WRAPPER" pr-wait --token-file "$tf" 2>&1 || true)"
assert_contains "pr-wait requires --number" "$out" "--number required"

# ---- T7: comment and blank lines in token file -----------------------------
f="$(mktemp)"; TEMP_FILES+=("$f")
cat > "$f" <<'EOF'
# leading comment
   # indented comment too

GH_TOKEN=ghp_test1234567890abcdefgh

GITEE_TOKEN=test1234567890abcdef
EOF
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file "$f" 2>&1)"
assert_contains "comment lines are skipped" "$out" "GH_TOKEN = ghp_***efgh"
assert_contains "blank lines are skipped"   "$out" "GITEE_TOKEN = test***cdef"

# ---- T7b: CRLF line endings (Windows-generated files) --------------------
# Some Windows tools (Notepad, PowerShell Out-File) save with CRLF.
# The wrapper must strip the \r and parse correctly.
f="$(mktemp)"; TEMP_FILES+=("$f")
printf 'GH_TOKEN=ghp_crlf1234567890ab\r\nGITEE_TOKEN=crlf1234567890ab\r\n' > "$f"
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file "$f" 2>&1)"
assert_contains "CRLF endings don't break parsing" "$out" "GH_TOKEN = ghp_***90ab"

# ---- T8: security - full token must NEVER appear in output -----------------
tf="$(make_token_file 1)"
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-status --token-file "$tf" 2>&1)"
if [[ "$out" == *"ghp_test1234567890abcdefgh"* ]]; then
    echo "FAIL  full token leaked in auth-status output"
    echo "      output: $out"
    ((FAIL++))
else
    echo "PASS  full token never appears in auth-status output"
    ((PASS++))
fi
if [[ "$out" == *"test1234567890abcdef"* ]]; then
    echo "FAIL  full GITEE token leaked in auth-status output"
    ((FAIL++))
else
    echo "PASS  full GITEE token never appears in auth-status output"
    ((PASS++))
fi

# ---- T9: --help exits 0 and shows usage ------------------------------------
out="$(cd "$REPO_ROOT" && "$WRAPPER" --help 2>&1)"
ec=$?
assert_eq "--help exits 0" "$ec" "0"
assert_contains "--help shows action list" "$out" "auth-status"
assert_contains "--help shows auth-gh"    "$out" "auth-gh"
assert_contains "--help shows pr-status" "$out" "pr-status"
assert_contains "--help shows pr-wait"   "$out" "pr-wait"

# ---- T10: auth-gh errors when token file missing (without running gh) ------
out="$(cd "$REPO_ROOT" && "$WRAPPER" auth-gh --token-file /tmp/__nonexistent_$$ 2>&1 || true)"
assert_contains "auth-gh errors when token file missing" "$out" "Token file not found"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $FAIL
