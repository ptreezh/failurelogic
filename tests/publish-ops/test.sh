#!/usr/bin/env bash
# test.sh - Smoke tests for scripts/publish-ops.sh
# Run from repo root:  bash tests/publish-ops/test.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WRAPPER="$REPO_ROOT/scripts/publish-ops.sh"

if [[ ! -x "$WRAPPER" ]]; then
    echo "FAIL  wrapper not found or not executable: $WRAPPER" >&2
    exit 1
fi

PASS=0; FAIL=0
TEMP_FILES=()
cleanup() {
    for f in "${TEMP_FILES[@]:-}"; do
        if [[ -d "$f" ]]; then rm -rf "$f"; else rm -f "$f"; fi
    done
}
trap cleanup EXIT

assert_eq() {
    local desc="$1" actual="$2" expected="$3"
    if [[ "$actual" == "$expected" ]]; then
        echo "PASS  $desc"; ((PASS++))
    else
        echo "FAIL  $desc"; ((FAIL++))
        echo "      expected: $expected"
        echo "      actual:   $actual"
    fi
}

assert_contains() {
    local desc="$1" haystack="$2" needle="$3"
    if [[ "$haystack" == *"$needle"* ]]; then
        echo "PASS  $desc"; ((PASS++))
    else
        echo "FAIL  $desc"; ((FAIL++))
        echo "      expected to contain: $needle"
        echo "      actual:              $haystack"
    fi
}

# Make a token file with all three tokens.
make_token_file() {
    local f; f="$(mktemp)"
    TEMP_FILES+=("$f")
    printf 'DOCKERHUB_USERNAME=testuser\nDOCKERHUB_TOKEN=dckr_test1234567890abcdef\nNPM_TOKEN=npm_test1234567890abcdef\n' > "$f"
    echo "$f"
}

echo "=== test.sh: publish-ops.sh ==="
echo ""

# T1: missing token file
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-build --image test 2>&1 || true)"
assert_contains "errors when token file missing" "$out" "Token file not found"

# T2: docker-build without --image
tf="$(make_token_file)"
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-build --token-file "$tf" 2>&1 || true)"
assert_contains "docker-build requires --image" "$out" "--image required"

# T3: docker-build without Dockerfile (in repo root where Dockerfile exists, this is fine;
#     use a fake path to test the missing-file error)
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-build --image test --dockerfile /nonexistent/Dockerfile --token-file "$tf" 2>&1 || true)"
assert_contains "docker-build errors when Dockerfile missing" "$out" "Dockerfile not found"

# T4: docker-push requires DOCKERHUB_USERNAME
tf_no_user="$(mktemp)"; TEMP_FILES+=("$tf_no_user")
printf 'DOCKERHUB_TOKEN=dckr_test1234567890abcdef\nNPM_TOKEN=npm_test1234567890abcdef\n' > "$tf_no_user"
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-push --image test --token-file "$tf_no_user" 2>&1 || true)"
assert_contains "docker-push requires DOCKERHUB_USERNAME" "$out" "DOCKERHUB_USERNAME is empty"

# T5: docker-push requires DOCKERHUB_TOKEN
tf_no_tok="$(mktemp)"; TEMP_FILES+=("$tf_no_tok")
printf 'DOCKERHUB_USERNAME=testuser\nNPM_TOKEN=npm_test1234567890abcdef\n' > "$tf_no_tok"
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-push --image test --token-file "$tf_no_tok" 2>&1 || true)"
assert_contains "docker-push requires DOCKERHUB_TOKEN" "$out" "DOCKERHUB_TOKEN is empty"

# T6: docker-push requires --image
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-push --token-file "$tf" 2>&1 || true)"
assert_contains "docker-push requires --image" "$out" "--image required"

# T7: npm-publish without package.json (run from /tmp)
cd /tmp
out="$(cd /tmp && "$WRAPPER" npm-publish --token-file "$tf" 2>&1 || true)"
assert_contains "npm-publish errors when package.json missing" "$out" "package.json not found"
cd "$REPO_ROOT"

# T8: npm-publish requires NPM_TOKEN
tf_no_npm="$(mktemp)"; TEMP_FILES+=("$tf_no_npm")
printf 'DOCKERHUB_USERNAME=testuser\nDOCKERHUB_TOKEN=dckr_test1234567890abcdef\n' > "$tf_no_npm"
# Create a temp package.json so we get past that check
tmpdir="$(mktemp -d)"; TEMP_FILES+=("$tmpdir")
echo '{"name":"test","version":"1.0.0"}' > "$tmpdir/package.json"
out="$(cd "$tmpdir" && "$WRAPPER" npm-publish --token-file "$tf_no_npm" 2>&1 || true)"
assert_contains "npm-publish requires NPM_TOKEN" "$out" "NPM_TOKEN is empty"

# T9: --help exits 0 and shows usage
out="$(cd "$REPO_ROOT" && "$WRAPPER" --help 2>&1)"
ec=$?
assert_eq "--help exits 0" "$ec" "0"
assert_contains "--help shows docker-build" "$out" "docker-build"
assert_contains "--help shows docker-push"  "$out" "docker-push"
assert_contains "--help shows npm-publish" "$out" "npm-publish"

# T10: unknown action (needs token file to get past the loading check)
out="$(cd "$REPO_ROOT" && "$WRAPPER" bogus-action --token-file "$tf" 2>&1 || true)"
assert_contains "unknown action errors helpfully" "$out" "Unknown action"

# T11: security - full token never appears in error output
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-push --image test --token-file "$tf_no_tok" 2>&1 || true)"
if [[ "$out" == *"dckr_test1234567890abcdef"* ]]; then
    echo "FAIL  DOCKERHUB_TOKEN leaked in error output"
    echo "      actual: $out"
    ((FAIL++))
else
    echo "PASS  DOCKERHUB_TOKEN never appears in error output"
    ((PASS++))
fi

# T15: CRLF line endings (Windows-generated files)
# The wrapper's token parser must strip \r from CRLF files; otherwise the
# masked token would print as "dckr_crlf12345\r7890" (extra \r breaks login).
# We use docker-push which prints "(user: X)" before attempting login —
# if CRLF leaked, "win\r" would appear and break the docker login line.
token_file="$(mktemp)"; TEMP_FILES+=("$token_file")
printf 'DOCKERHUB_USERNAME=win\r\nDOCKERHUB_TOKEN=dckr_crlf1234567890\r\nNPM_TOKEN=npm_crlf1234567890\r\n' > "$token_file"
out="$(cd "$REPO_ROOT" && "$WRAPPER" docker-push --image fake --token-file "$token_file" 2>&1 || true)"
# After CRLF stripping, "(user: win)" prints clean (no trailing CR).
assert_contains "CRLF endings don't break token parsing" "$out" "(user: win)"
assert_not_contains_helper() {
    local desc="$1" haystack="$2" needle="$3"
    if [[ "$haystack" != *"$needle"* ]]; then
        echo "PASS  $desc"
        ((PASS++))
    else
        echo "FAIL  $desc"
        ((FAIL++))
        echo "      must NOT contain: $needle"
    fi
}
assert_not_contains_helper "CRLF stripped: no \r in output" "$out" $'\r'

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $FAIL
