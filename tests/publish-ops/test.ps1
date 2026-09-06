# test.ps1 - Smoke tests for scripts/publish-ops.ps1
# Run from repo root:  powershell -ExecutionPolicy Bypass -File tests/publish-ops/test.ps1

$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Wrapper   = Join-Path $RepoRoot 'scripts/publish-ops.ps1'

if (-not (Test-Path $Wrapper)) {
    Write-Host "FAIL  wrapper not found: $Wrapper" -ForegroundColor Red
    exit 1
}

$script:Pass = 0
$script:Fail = 0
$script:TempFiles = @()

function Cleanup-TempFiles {
    foreach ($f in $script:TempFiles) {
        if (Test-Path $f) { Remove-Item $f -Recurse -Force -ErrorAction SilentlyContinue }
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
    if ($Haystack.Contains($Needle)) {
        Write-Host "FAIL  $Desc" -ForegroundColor Red
        Write-Host "      must NOT contain: $Needle"
        $script:Fail++
    } else {
        Write-Host "PASS  $Desc"; $script:Pass++
    }
}

function New-PubTokenFile {
    # Always include all three tokens by default.
    param([hashtable]$Keys = @{})
    $f = [System.IO.Path]::GetTempFileName()
    $script:TempFiles += $f
    $lines = @()
    foreach ($k in @('DOCKERHUB_USERNAME', 'DOCKERHUB_TOKEN', 'NPM_TOKEN')) {
        $v = if ($Keys.ContainsKey($k)) { $Keys[$k] } else { "test_$k`_value" }
        $lines += "$k=$v"
    }
    Set-Content -Path $f -Value ($lines -join "`n") -NoNewline
    return $f
}

Write-Host "=== test.ps1: publish-ops.ps1 ==="
Write-Host ""

# T1: missing token file
$missing = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "__nonexistent_pub_$([System.Guid]::NewGuid()).txt")
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-build -Image test -TokenFile $missing 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'errors when token file missing' -Haystack $out -Needle 'Token file not found'

# T2: docker-build requires -Image
$tf = New-PubTokenFile
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-build -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'docker-build requires -Image' -Haystack $out -Needle '-Image is required'

# T3: docker-build errors when Dockerfile missing
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-build -Image test -Dockerfile '/nonexistent/Dockerfile' -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'docker-build errors when Dockerfile missing' -Haystack $out -Needle 'Dockerfile not found'

# T4: docker-push requires DOCKERHUB_USERNAME
$tfNoUser = New-PubTokenFile -Keys @{ DOCKERHUB_USERNAME = $null }
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-push -Image test -TokenFile $tfNoUser 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'docker-push requires DOCKERHUB_USERNAME' -Haystack $out -Needle 'DOCKERHUB_USERNAME is empty'

# T5: docker-push requires DOCKERHUB_TOKEN
$tfNoTok = New-PubTokenFile -Keys @{ DOCKERHUB_TOKEN = $null }
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-push -Image test -TokenFile $tfNoTok 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'docker-push requires DOCKERHUB_TOKEN' -Haystack $out -Needle 'DOCKERHUB_TOKEN is empty'

# T6: docker-push requires -Image
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-push -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'docker-push requires -Image' -Haystack $out -Needle '-Image is required'

# T7: npm-publish without package.json — run from a temp dir
$tmpdir = Join-Path ([System.IO.Path]::GetTempPath()) "npmpubtest_$([System.Guid]::NewGuid())"
$script:TempFiles += $tmpdir
New-Item -ItemType Directory -Path $tmpdir | Out-Null
$tfNoNpm = New-PubTokenFile -Keys @{ NPM_TOKEN = $null }
Push-Location $tmpdir
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action npm-publish -TokenFile $tfNoNpm 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'npm-publish errors when package.json missing' -Haystack $out -Needle 'package.json not found'

# T8: npm-publish requires NPM_TOKEN
$tmpdir2 = Join-Path ([System.IO.Path]::GetTempPath()) "npmpubtest2_$([System.Guid]::NewGuid())"
$script:TempFiles += $tmpdir2
New-Item -ItemType Directory -Path $tmpdir2 | Out-Null
Set-Content -Path (Join-Path $tmpdir2 'package.json') -Value '{"name":"test","version":"1.0.0"}'
$tfNoNpm2 = New-PubTokenFile -Keys @{ NPM_TOKEN = $null }
Push-Location $tmpdir2
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action npm-publish -TokenFile $tfNoNpm2 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'npm-publish requires NPM_TOKEN' -Haystack $out -Needle 'NPM_TOKEN is empty'

# T9: security - full DOCKERHUB_TOKEN never appears in output
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action docker-push -Image test -TokenFile $tfNoTok 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-NotContains -Desc 'DOCKERHUB_TOKEN never appears in error output' `
    -Haystack $out -Needle 'dckr_test_DOCKERHUB_TOKEN_value'

# T10: unknown action
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action bogus-action -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-NotContains -Desc 'unknown action does not silently succeed' -Haystack $out -Needle 'Built'

Cleanup-TempFiles

Write-Host ""
Write-Host "=== Results: $($script:Pass) passed, $($script:Fail) failed ==="
exit $script:Fail
