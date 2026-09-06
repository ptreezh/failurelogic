# test.ps1 - Smoke tests for scripts/release-ops.ps1
# Uses a temp git repo so tag/release don't pollute the real one.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File tests/release-ops/test.ps1

$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Wrapper   = Join-Path $RepoRoot 'scripts/release-ops.ps1'

if (-not (Test-Path $Wrapper)) {
    Write-Host "FAIL  wrapper not found: $Wrapper" -ForegroundColor Red
    exit 1
}

$script:Pass = 0
$script:Fail = 0
$script:TempDirs = @()

function Cleanup-TempDirs {
    foreach ($d in $script:TempDirs) {
        if (Test-Path $d) { Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

function Assert-Eq {
    param([string]$Desc, [string]$Actual, [string]$Expected)
    if ($Actual -eq $Expected) {
        Write-Host "PASS  $Desc"; $script:Pass++
    } else {
        Write-Host "FAIL  $Desc" -ForegroundColor Red
        Write-Host "      expected: $Expected"
        Write-Host "      actual:   $Actual"
        $script:Fail++
    }
}

function Assert-Contains {
    param([string]$Desc, [string]$Haystack, [string]$Needle)
    if ($Haystack.Contains($Needle)) {
        Write-Host "PASS  $Desc"; $script:Pass++
    } else {
        Write-Host "FAIL  $Desc" -ForegroundColor Red
        Write-Host "      expected to contain: $Needle"
        Write-Host "      actual:              $Haystack"
        $script:Fail++
    }
}

function Assert-NotContains {
    param([string]$Desc, [string]$Haystack, [string]$Needle)
    if (-not $Haystack.Contains($Needle)) {
        Write-Host "PASS  $Desc"; $script:Pass++
    } else {
        Write-Host "FAIL  $Desc" -ForegroundColor Red
        Write-Host "      must NOT contain: $Needle"
        $script:Fail++
    }
}

function New-TempRepo {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) "rel_op_test_$([System.Guid]::NewGuid())"
    $script:TempDirs += $d
    New-Item -ItemType Directory -Path $d | Out-Null
    Push-Location $d
    try {
        git init -q -b main 2>&1 | Out-Null
        git config user.email 'test@test.local'
        git config user.name 'Test'
        git config commit.gpgsign false
        'init' | Set-Content -Path 'README.md'
        git add README.md | Out-Null
        git commit -q -m 'Initial commit' | Out-Null
        'feature 1' | Add-Content -Path 'README.md'
        git commit -q -am 'Add feature 1' | Out-Null
        'feature 2' | Add-Content -Path 'README.md'
        git commit -q -am 'Add feature 2' | Out-Null
    } finally {
        Pop-Location
    }
    return $d
}

function Invoke-Release {
    param(
        [string]$Action,
        [string]$Dir,
        [hashtable]$Extra = @{}
    )
    $args = @()
    if ($Action) { $args += @('-Action', $Action) }
    foreach ($k in $Extra.Keys) {
        $v = $Extra[$k]
        if ($v -is [bool]) {
            if ($v) { $args += "-$k" }
        } elseif ($null -ne $v) {
            $args += @("-$k", "$v")
        }
    }
    Push-Location $Dir
    try {
        $out = powershell -ExecutionPolicy Bypass -File $Wrapper @args 2>&1 | Out-String
    } finally {
        Pop-Location
    }
    return $out
}

Write-Host "=== test.ps1: release-ops.ps1 ==="
Write-Host ""

# T1: tag requires -Version
$out = Invoke-Release -Action 'tag' -Dir $RepoRoot
Assert-Contains -Desc 'tag requires -Version' -Haystack $out -Needle '-Version is required'

# T2: tag rejects invalid semver
$repo = New-TempRepo
$out = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = 'not.a.version'; DryRun = $true }
Assert-Contains -Desc 'tag rejects invalid semver' -Haystack $out -Needle 'not valid semver'

# T3: tag accepts valid semver (dry-run)
$repo = New-TempRepo
$out = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = '1.2.3'; DryRun = $true }
Assert-Contains -Desc 'tag accepts bare X.Y.Z (dry-run)' -Haystack $out -Needle 'git tag -a v1.2.3'
Assert-Contains -Desc 'tag dry-run message present' -Haystack $out -Needle 'Release v1.2.3'

# T4: tag accepts v-prefixed semver
$repo = New-TempRepo
$out = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = 'v2.0.0-rc.1'; DryRun = $true }
Assert-Contains -Desc 'tag accepts v-prefixed semver' -Haystack $out -Needle 'git tag -a v2.0.0-rc.1'

# T5: tag creates annotated tag (real run)
$repo = New-TempRepo
$out = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = '0.1.0' }
Assert-Contains -Desc 'tag creation succeeds' -Haystack $out -Needle 'Created tag v0.1.0'
Push-Location $repo
try {
    $existing = git tag -l
} finally {
    Pop-Location
}
Assert-Contains -Desc 'tag v0.1.0 exists in repo' -Haystack $existing -Needle 'v0.1.0'
Push-Location $repo
try {
    $tagType = git cat-file -t v0.1.0 2>$null
} finally {
    Pop-Location
}
$tagType = ($tagType | Out-String).Trim()
Assert-Eq -Desc 'tag is annotated (object type = tag)' -Actual $tagType -Expected 'tag'

# T6: tag rejects duplicate
$repo = New-TempRepo
$null = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = '1.0.0' }
$out = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = '1.0.0' }
Assert-Contains -Desc 'tag rejects duplicate' -Haystack $out -Needle 'already exists'

# T7: notes shows recent commits when no tags
$repo = New-TempRepo
$out = Invoke-Release -Action 'notes' -Dir $repo
Assert-Contains -Desc 'notes shows recent commits' -Haystack $out -Needle 'Add feature 2'
Assert-Contains -Desc 'notes shows no-previous-tags note' -Haystack $out -Needle 'no previous tags'

# T8: notes shows commits since tag
$repo = New-TempRepo
$null = Invoke-Release -Action 'tag' -Dir $repo -Extra @{ Version = '0.1.0' }
Push-Location $repo
try {
    'post-tag 1' | Add-Content -Path 'README.md'
    git commit -q -am 'Post-tag commit 1' | Out-Null
    'post-tag 2' | Add-Content -Path 'README.md'
    git commit -q -am 'Post-tag commit 2' | Out-Null
} finally {
    Pop-Location
}
$out = Invoke-Release -Action 'notes' -Dir $repo
Assert-Contains -Desc 'notes since tag includes post-tag commits' -Haystack $out -Needle 'Post-tag commit 2'
Assert-NotContains -Desc 'notes since tag excludes pre-tag commits' -Haystack $out -Needle 'Add feature 2'

# T9: notes --format json returns parseable JSON
$repo = New-TempRepo
Push-Location $repo
try {
    # Suppress stderr (the "(no previous tags;...)" header would break JSON parsing).
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action notes -Format json 2>$null | Out-String
} finally {
    Pop-Location
}
try {
    $parsed = $out | ConvertFrom-Json
    if ($parsed.Count -gt 0) {
        Write-Host "PASS  notes --format json returns parseable list with $($parsed.Count) commits"
        $script:Pass++
    } else {
        Write-Host "FAIL  notes --format json returned empty list"
        $script:Fail++
    }
} catch {
    Write-Host "FAIL  notes --format json did not return valid JSON"
    Write-Host "      actual: $out"
    $script:Fail++
}

# T10: --help exits 0 and shows usage
$out = Invoke-Release -Action '' -Dir $RepoRoot
# Actually --help is a builtin; check by passing --help as action via test
# Instead test that the wrapper errored on missing action with usage text
# (no, that's different). Use direct file call for --help:
$out = pwsh -NoProfile -File $Wrapper --help 2>&1 | Out-String
$ec = $LASTEXITCODE
Assert-Eq -Desc '--help exits 0' -Actual "$ec" -Expected '0'
Assert-Contains -Desc '--help shows notes' -Haystack $out -Needle 'notes'
Assert-Contains -Desc '--help shows tag' -Haystack $out -Needle 'tag'
Assert-Contains -Desc '--help shows release' -Haystack $out -Needle 'release'

# T11: unknown action
$out = Invoke-Release -Action 'bogus-action' -Dir $RepoRoot
Assert-NotContains -Desc 'unknown action does not silently succeed' -Haystack $out -Needle 'Created tag'

# T12: release -Version required
$out = Invoke-Release -Action 'release' -Dir $RepoRoot
Assert-Contains -Desc 'release requires -Version' -Haystack $out -Needle '-Version is required'

# T13: release --dry-run doesn't actually call gh or create tag
$repo = New-TempRepo
$tokenFile = [System.IO.Path]::GetTempFileName()
$script:TempDirs += $tokenFile
Set-Content -Path $tokenFile -Value 'GH_TOKEN=ghp_test1234567890abcdefgh' -NoNewline
$out = Invoke-Release -Action 'release' -Dir $repo -Extra @{ Version = '1.5.0'; DryRun = $true; TokenFile = $tokenFile }
Assert-Contains -Desc 'release --dry-run prints dry-run tag line' -Haystack $out -Needle '[dry-run] git tag'
Assert-Contains -Desc 'release --dry-run prints dry-run push line' -Haystack $out -Needle '[dry-run] git push'
Push-Location $repo
try {
    $existingTags = git tag -l
} finally {
    Pop-Location
}
Assert-NotContains -Desc 'release --dry-run does not actually create tag' -Haystack $existingTags -Needle 'v1.5.0'

Cleanup-TempDirs

Write-Host ""
Write-Host "=== Results: $($script:Pass) passed, $($script:Fail) failed ==="
exit $script:Fail
