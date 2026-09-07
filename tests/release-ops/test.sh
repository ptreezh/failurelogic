#!/usr/bin/env bash
# test.sh - Smoke tests for scripts/release-ops.sh
#
# Uses a temporary git repo so tag/release don't pollute the real repo.
# Run from repo root:  bash tests/release-ops/test.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WRAPPER="$REPO_ROOT/scripts/release-ops.sh"

if [[ ! -x "$WRAPPER" ]]; then
    echo "FAIL  wrapper not found or not executable: $WRAPPER" >&2
    exit 1
fi

PASS=0; FAIL=0
TEMP_DIRS=()
cleanup() {
    # Restore CWD to repo root before removing temp dirs, so `rm -rf` always
    # operates on a known safe path even if the shell got stuck inside a temp
    # directory that was already partially cleaned.
    cd "$REPO_ROOT" 2>/dev/null || cd /tmp
    for d in "${TEMP_DIRS[@]:-}"; do
        if [[ -d "$d" ]]; then rm -rf "$d"; else rm -f "$d"; fi
    done
}
trap cleanup EXIT INT TERM

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

assert_not_contains() {
    local desc="$1" haystack="$2" needle="$3"
    if [[ "$haystack" != *"$needle"* ]]; then
        echo "PASS  $desc"; ((PASS++))
    else
        echo "FAIL  $desc"; ((FAIL++))
        echo "      must NOT contain: $needle"
    fi
}

# Create a temp git repo with a few commits.
#
# SAFETY: this function previously leaked commits into the parent repo when
# mktemp -d silently returned an empty path. Pushd with an empty argument
# is a no-op but exits 0, so `git init` ran in the parent repo, creating
# fake commits in main history. Defensive guards added:
#   1. mktemp -d MUST succeed (else FATAL abort)
#   2. pushd MUST succeed and pwd MUST actually change
#   3. cd back to prev_dir on any abort
#   4. verify .git/HEAD looks like a fresh repo before continuing
#   5. cleanup trap also resets cwd before `rm -rf`
make_repo() {
    local d
    if ! d="$(mktemp -d 2>/dev/null)" || [[ -z "$d" ]]; then
        echo "FATAL: mktemp -d failed" >&2
        return 1
    fi
    TEMP_DIRS+=("$d")

    local prev_dir="$PWD"
    if ! pushd "$d" > /dev/null 2>&1; then
        echo "FATAL: pushd to '$d' failed" >&2
        return 1
    fi
    if [[ "$PWD" == "$prev_dir" ]]; then
        echo "FATAL: pushd succeeded but pwd unchanged (was '$prev_dir', still '$PWD')" >&2
        echo "This is the failure mode that previously leaked commits into main." >&2
        popd > /dev/null 2>&1 || true
        return 1
    fi

    if ! git init -q -b main; then
        echo "FATAL: git init failed in '$d'" >&2
        popd > /dev/null 2>&1 || true
        return 1
    fi
    git config user.email "test@test.local"
    git config user.name "Test"
    git config commit.gpgsign false

    # Defense-in-depth: verify this is a freshly-created repo, not the parent.
    if [[ ! -f .git/HEAD ]] || ! grep -q 'ref: refs/heads/' .git/HEAD; then
        echo "FATAL: .git/HEAD in '$d' doesn't look like a fresh repo" >&2
        popd > /dev/null 2>&1 || true
        return 1
    fi

    echo "init" > README.md
    git add README.md && git commit -q -m "Initial commit"
    echo "feature 1" >> README.md && git commit -q -am "Add feature 1"
    echo "feature 2" >> README.md && git commit -q -am "Add feature 2"
    popd > /dev/null
    echo "$d"
}

echo "=== test.sh: release-ops.sh ==="
echo ""

# T0: REGRESSION GUARD — running this test must NOT leak commits into the
# parent repo. Prior to hardening make_repo, a mktemp/pushd race could
# silently create fake "Add feature 1/2" commits in main history. This
# assertion captures the HEAD SHA before any test runs and verifies it
# hasn't changed after the suite.
# (Skipped when test is run from a subdirectory outside main repo, e.g.
# when called via `bash -c 'cd elsewhere && test.sh'`.)
TEST_START_HEAD="$(cd "$REPO_ROOT" && git rev-parse HEAD 2>/dev/null || echo unknown)"
TEST_START_TAGS="$(cd "$REPO_ROOT" && git tag -l 2>/dev/null | wc -l | tr -d ' ')"
out="$(cd "$REPO_ROOT" && "$WRAPPER" tag 2>&1 || true)"
assert_contains "tag requires --version" "$out" "--version required"

# T2: tag rejects invalid semver
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version "not.a.version" --dry-run 2>&1 || true)"
assert_contains "tag rejects invalid semver" "$out" "not valid semver"

# T3: tag accepts valid semver (dry-run)
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version 1.2.3 --dry-run 2>&1 || true)"
assert_contains "tag accepts bare X.Y.Z (dry-run)" "$out" "git tag -a v1.2.3"
assert_contains "tag prints Release in dry-run" "$out" "Release v1.2.3"

# T4: tag accepts v-prefixed semver (dry-run)
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version v2.0.0-rc.1 --dry-run 2>&1 || true)"
assert_contains "tag accepts v-prefixed semver (dry-run)" "$out" "git tag -a v2.0.0-rc.1"

# T5: tag creates annotated tag (real run)
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version 0.1.0 2>&1 || true)"
assert_contains "tag creation succeeds" "$out" "tag v0.1.0"
tag_list="$(cd "$repo" && git tag -l)"
assert_contains "tag v0.1.0 exists" "$tag_list" "v0.1.0"
tag_type="$(cd "$repo" && git cat-file -t v0.1.0 2>/dev/null || true)"
assert_eq "tag is annotated (object type tag, not commit)" "$tag_type" "tag"

# T6: tag rejects creating duplicate
repo="$(make_repo)"
cd "$repo" && "$WRAPPER" tag --version 1.0.0 > /dev/null 2>&1
out="$(cd "$repo" && "$WRAPPER" tag --version 1.0.0 2>&1 || true)"
assert_contains "tag rejects duplicate" "$out" "already exists"

# T7: notes shows recent commits when no tags
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" notes 2>&1 || true)"
assert_contains "notes shows recent commits when no tags" "$out" "Add feature 2"
assert_contains "notes shows the message about no previous tags" "$out" "no previous tags"

# T8: notes --since shows commits after a tag
repo="$(make_repo)"
cd "$repo" && "$WRAPPER" tag --version 0.1.0 > /dev/null 2>&1
echo "post-tag 1" >> README.md && git commit -q -am "Post-tag commit 1"
echo "post-tag 2" >> README.md && git commit -q -am "Post-tag commit 2"
out="$(cd "$repo" && "$WRAPPER" notes 2>&1 || true)"
assert_contains "notes since tag shows post-tag commit" "$out" "Post-tag commit 2"
assert_not_contains "notes since tag excludes pre-tag commit" "$out" "Add feature 2"

# T9: notes --format json produces parseable JSON
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" notes --format json 2>/dev/null || true)"
PY="$(command -v python3 2>/dev/null || command -v python 2>/dev/null || echo "")"
if [[ -n "$PY" ]] && "$PY" -c "import json,sys; d=json.loads(sys.argv[1]); assert isinstance(d, list) and len(d) > 0" "$out" 2>/dev/null; then
    echo "PASS  notes --format json returns valid JSON list"
    ((PASS++))
else
    echo "FAIL  notes --format json did not return valid JSON (or python not available)"
    echo "      actual (first 200 chars): ${out:0:200}"
    ((FAIL++))
fi

# T10: --help exits 0 and shows usage
out="$(cd "$REPO_ROOT" && "$WRAPPER" --help 2>&1)"
ec=$?
assert_eq "--help exits 0" "$ec" "0"
assert_contains "--help shows notes" "$out" "notes"
assert_contains "--help shows tag"   "$out" "tag"
assert_contains "--help shows release" "$out" "release"

# T11: unknown action
out="$(cd "$REPO_ROOT" && "$WRAPPER" bogus-action 2>&1 || true)"
assert_contains "unknown action errors helpfully" "$out" "Unknown action"

# T12: release --version required
out="$(cd "$REPO_ROOT" && "$WRAPPER" release 2>&1 || true)"
assert_contains "release requires --version" "$out" "--version required"

# T13: release --dry-run doesn't push or call gh
repo="$(make_repo)"
# release loads GH_TOKEN even in dry-run mode, so provide a token file
token_file="$(mktemp)"; TEMP_DIRS+=("$token_file")
printf 'GH_TOKEN=ghp_test1234567890abcdefgh\n' > "$token_file"
out="$(cd "$repo" && "$WRAPPER" release --version 1.5.0 --dry-run --token-file "$token_file" 2>&1 || true)"
assert_contains "release --dry-run prints dry-run tag line" "$out" "[dry-run] git tag"
assert_contains "release --dry-run prints dry-run push line" "$out" "[dry-run] git push"
tag_list="$(cd "$repo" && git tag -l)"
assert_not_contains "release --dry-run does not actually create tag" "$tag_list" "v1.5.0"

# T14: tag --sign emits git tag -s
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version 1.0.0 --sign --dry-run 2>&1 || true)"
assert_contains "tag --sign uses -s flag in dry-run" "$out" "git tag -s v1.0.0"

# T15: tag --sign-key emits -u KEY
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version 1.0.0 --sign --sign-key ABCDEF12 --dry-run 2>&1 || true)"
assert_contains "tag --sign-key uses -u with key id" "$out" "-u ABCDEF12"

# T16: tag without --sign defaults to -a
repo="$(make_repo)"
out="$(cd "$repo" && "$WRAPPER" tag --version 1.0.0 --dry-run 2>&1 || true)"
assert_contains "tag without --sign uses -a (annotated)" "$out" "git tag -a v1.0.0"
assert_not_contains "tag without --sign does not mention signed" "$out" "signed"

# T17: verify requires --version
out="$(cd "$REPO_ROOT" && "$WRAPPER" verify 2>&1 || true)"
assert_contains "verify requires --version" "$out" "--version required"

# T18: verify on nonexistent tag
out="$(cd "$REPO_ROOT" && "$WRAPPER" verify --version 99.99.99 2>&1 || true)"
assert_contains "verify errors on nonexistent tag" "$out" "does not exist"

# T19: --help mentions --sign
out="$(cd "$REPO_ROOT" && "$WRAPPER" --help 2>&1)"
assert_contains "--help mentions --sign" "$out" "--sign"
assert_contains "--help mentions verify" "$out" "verify"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

# T-leakguard: verify no commits / tags leaked into main repo during this run.
if [[ "$TEST_START_HEAD" != "unknown" ]]; then
    # CRITICAL: capture from $REPO_ROOT explicitly. If a previous test left
    # us in a temp dir, `git rev-parse HEAD` would return the temp repo's
    # HEAD, not main's.
    TEST_END_HEAD="$(cd "$REPO_ROOT" && git rev-parse HEAD)"
    TEST_END_TAGS="$(cd "$REPO_ROOT" && git tag -l | wc -l | tr -d ' ')"
    if [[ "$TEST_END_HEAD" != "$TEST_START_HEAD" ]]; then
        echo "FAIL  CRITICAL: test suite leaked commits into main repo"
        echo "      HEAD before: $TEST_START_HEAD"
        echo "      HEAD after:  $TEST_END_HEAD"
        echo "      Diff: $(cd "$REPO_ROOT" && git log --oneline $TEST_START_HEAD..$TEST_END_HEAD)"
        FAIL=$((FAIL + 1))
    else
        echo "PASS  test suite did not leak commits into main repo (HEAD unchanged)"
        PASS=$((PASS + 1))
    fi
    if [[ "$TEST_END_TAGS" != "$TEST_START_TAGS" ]]; then
        echo "FAIL  CRITICAL: test suite leaked tags into main repo"
        echo "      Tags before: $TEST_START_TAGS, Tags after: $TEST_END_TAGS"
        FAIL=$((FAIL + 1))
    else
        echo "PASS  test suite did not leak tags (tag count unchanged)"
        PASS=$((PASS + 1))
    fi
fi

exit $FAIL
