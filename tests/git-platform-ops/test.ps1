# test.ps1 - Smoke tests for scripts/git-platform-ops.ps1
#
# No Pester required. Pure PowerShell with assert helpers.
# Exit code = number of failures.
#
# Run from repo root:  powershell -ExecutionPolicy Bypass -File tests/git-platform-ops/test.ps1

$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Wrapper   = Join-Path $RepoRoot 'scripts/git-platform-ops.ps1'

if (-not (Test-Path $Wrapper)) {
    Write-Host "FAIL  wrapper not found: $Wrapper" -ForegroundColor Red
    exit 1
}

$script:Pass = 0
$script:Fail = 0
$script:TempFiles = @()

function Cleanup-TempFiles {
    foreach ($f in $script:TempFiles) {
        if (Test-Path $f) { Remove-Item $f -Force }
    }
}
# Register cleanup (PowerShell 7+) or fall back
if ($PSVersionTable.PSVersion.Major -ge 7) {
    Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup-TempFiles } | Out-Null
}

function Assert-Contains {
    param([string]$Desc, [string]$Haystack, [string]$Needle)
    if ($Haystack.Contains($Needle)) {
        Write-Host "PASS  $Desc"
        $script:Pass++
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
        Write-Host "      actual:           $Haystack"
        $script:Fail++
    } else {
        Write-Host "PASS  $Desc"
        $script:Pass++
    }
}

function Assert-Eq {
    param([string]$Desc, [string]$Actual, [string]$Expected)
    if ($Actual -eq $Expected) {
        Write-Host "PASS  $Desc"
        $script:Pass++
    } else {
        Write-Host "FAIL  $Desc" -ForegroundColor Red
        Write-Host "      expected: $Expected"
        Write-Host "      actual:   $Actual"
        $script:Fail++
    }
}

function New-TokenFile {
    # $1 = include trailing newline ("1" yes, "0" no)
    param([string]$WithNewline)
    $f = [System.IO.Path]::GetTempFileName()
    $script:TempFiles += $f
    if ($WithNewline -eq '1') {
        Set-Content -Path $f -Value "GH_TOKEN=ghp_test1234567890abcdefgh`nGITEE_TOKEN=test1234567890abcdef`n" -NoNewline
    } else {
        Set-Content -Path $f -Value "GH_TOKEN=ghp_test1234567890abcdefgh`nGITEE_TOKEN=test1234567890abcdef" -NoNewline
    }
    return $f
}

function Invoke-Wrapper {
    param(
        [string]$Action,
        [string]$TokenFile = $null,
        [hashtable]$Extra = @{}
    )
    $args = @('-Action', $Action)
    if ($TokenFile) {
        $args += @('-TokenFile', $TokenFile)
    }
    foreach ($k in $Extra.Keys) {
        $args += @("-$k", "$($Extra[$k])")
    }
    Push-Location $RepoRoot
    try {
        $output = & powershell -ExecutionPolicy Bypass -File $Wrapper @args 2>&1 | Out-String
    } finally {
        Pop-Location
    }
    return $output
}

Write-Host "=== test.ps1: git-platform-ops.ps1 ==="
Write-Host ""

# ---- T1: info action --------------------------------------------------------
$out = Invoke-Wrapper -Action 'info'
Assert-Contains -Desc 'info shows platform' -Haystack $out -Needle 'Platform:  github'
Assert-Contains -Desc 'info shows owner' -Haystack $out -Needle 'Owner:     ptreezh'
Assert-Contains -Desc 'info shows repo (no .git suffix)' -Haystack $out -Needle 'Repo:      failurelogic'
# Only the "Repo:" line must not contain .git (the Remote URL line is allowed to).
$repoLine = ($out -split "`n" | Where-Object { $_ -match '^Repo:' } | Select-Object -First 1)
Assert-NotContains -Desc 'info strips .git suffix from Repo: line' -Haystack $repoLine -Needle '.git'

# ---- T2: auth-status with trailing newline ----------------------------------
$tf = New-TokenFile -WithNewline '1'
$out = Invoke-Wrapper -Action 'auth-status' -TokenFile $tf
Assert-Contains -Desc 'auth-status masks GH_TOKEN'   -Haystack $out -Needle 'GH_TOKEN = ghp_***efgh'
Assert-Contains -Desc 'auth-status masks GITEE_TOKEN' -Haystack $out -Needle 'GITEE_TOKEN = test***cdef'

# ---- T3: regression - token file WITHOUT trailing newline -------------------
$tf = New-TokenFile -WithNewline '0'
$out = Invoke-Wrapper -Action 'auth-status' -TokenFile $tf
Assert-Contains -Desc 'auth-status loads GITEE_TOKEN without trailing newline' `
    -Haystack $out -Needle 'GITEE_TOKEN = ghp_***efgh'.Replace('ghp_***efgh', 'test***cdef')

# ---- T4: auth-status missing file -------------------------------------------
$out = Push-Location $RepoRoot | Out-Null; Pop-Location
$missing = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "__nonexistent_$([System.Guid]::NewGuid()).txt")
$out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action auth-status -TokenFile $missing 2>&1 | Out-String
Assert-Contains -Desc 'auth-status errors when file missing' -Haystack $out -Needle 'Token file not found'
Assert-Contains -Desc 'auth-status error mentions setup command' -Haystack $out -Needle 'cp .git-token.example'

# ---- T5: unknown action -----------------------------------------------------
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action bogus-action 2>&1 | Out-String
} finally {
    Pop-Location
}
# unknown action in PS would fail ValidateSet; it would error out at param binding.
# We're checking that the script doesn't silently succeed.
Assert-NotContains -Desc 'unknown action does not silently succeed' -Haystack $out -Needle 'Loaded from'

# ---- T6: required args ------------------------------------------------------
# Token loading runs first; provide a token file so we get to the -Title check.
$tf = New-TokenFile -WithNewline '1'
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action pr-create -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'pr-create requires -Title' -Haystack $out -Needle '-Title is required'

Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action issue-create -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'issue-create requires -Title' -Haystack $out -Needle '-Title is required'

Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action pr-status -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'pr-status requires -Number' -Haystack $out -Needle '-Number is required'

Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action pr-wait -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'pr-wait requires -Number' -Haystack $out -Needle '-Number is required'

# ---- T7: comment and blank lines in token file -----------------------------
$f = [System.IO.Path]::GetTempFileName()
$script:TempFiles += $f
@'
# leading comment
   # indented comment too

GH_TOKEN=ghp_test1234567890abcdefgh

GITEE_TOKEN=test1234567890abcdef
'@ | Set-Content -Path $f -NoNewline

Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action auth-status -TokenFile $f 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'comment lines are skipped' -Haystack $out -Needle 'GH_TOKEN = ghp_***efgh'
Assert-Contains -Desc 'blank lines are skipped'   -Haystack $out -Needle 'GITEE_TOKEN = test***cdef'

# ---- T8: security - full token must NEVER appear in output -----------------
$tf = New-TokenFile -WithNewline '1'
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action auth-status -TokenFile $tf 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-NotContains -Desc 'full GH token never appears in auth-status output' `
    -Haystack $out -Needle 'ghp_test1234567890abcdefgh'
Assert-NotContains -Desc 'full GITEE token never appears in auth-status output' `
    -Haystack $out -Needle 'test1234567890abcdef'

# ---- T9: auth-gh errors when token file missing ----------------------------
$missing = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "__nonexistent_auth_$([System.Guid]::NewGuid()).txt")
Push-Location $RepoRoot
try {
    $out = powershell -ExecutionPolicy Bypass -File $Wrapper -Action auth-gh -TokenFile $missing 2>&1 | Out-String
} finally {
    Pop-Location
}
Assert-Contains -Desc 'auth-gh errors when token file missing' -Haystack $out -Needle 'Token file not found'

# ---- Cleanup ---------------------------------------------------------------
Cleanup-TempFiles

Write-Host ""
Write-Host "=== Results: $($script:Pass) passed, $($script:Fail) failed ==="
exit $script:Fail
