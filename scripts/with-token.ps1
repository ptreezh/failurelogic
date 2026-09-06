# with-token.ps1 - Inject git credentials from local file into a command's environment.
#
# Why: keeps tokens OFF chat with AI tools. AI suggests commands; you wrap them
# in -Run, the script substitutes env vars from .git-token without ever printing them.
#
# Usage:
#   .\scripts\with-token.ps1 -Show
#       List which keys are loaded (values are masked).
#
#   .\scripts\with-token.ps1 -Shell
#       Open a new PowerShell with GH_TOKEN / GITEE_TOKEN in scope.
#       Type `exit` to leave. Useful for multi-command sessions.
#
#   .\scripts\with-token.ps1 -Run "git push origin main"
#       Run a single command. $GH_TOKEN / $GITEE_TOKEN expand inside the string.
#
#   .\scripts\with-token.ps1 -EnvFile .secrets.local -Run "..."
#       Use a different env file. Defaults to .git-token at repo root.
#
# First-time setup:
#   1. Copy template:  cp .git-token.example .git-token
#   2. Fill in tokens from:
#        GitHub: https://github.com/settings/personal-access-tokens/new
#        Gitee:  https://gitee.com/personal_access_tokens
#   3. Pick minimal scopes + 7-day expiry (see .git-token.example for guidance).
#
# Security notes:
#   - .git-token is gitignored. Do NOT commit it.
#   - Tokens live only in process memory of the spawned command.
#   - Exit the -Shell session when done; env vars do not persist across sessions.

[CmdletBinding()]
param(
    [switch]$Shell,
    [switch]$Show,
    [string]$Run,
    [string]$EnvFile = ".git-token"
)

$ErrorActionPreference = "Stop"

function Load-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Host "ERROR: env file not found: $Path" -ForegroundColor Red
        Write-Host ""
        Write-Host "Setup:" -ForegroundColor Yellow
        Write-Host "  cp .git-token.example .git-token" -ForegroundColor Yellow
        Write-Host "  # then edit .git-token and fill in your tokens" -ForegroundColor Yellow
        exit 1
    }
    $resolved = (Resolve-Path $Path).Path
    Get-Content $resolved | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $name = $Matches[1]
            $value = $Matches[2]
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Format-Masked {
    param([string]$Value)
    if ([string]::IsNullOrEmpty($Value)) { return "(empty)" }
    if ($Value.Length -le 8) { return "***" }
    return $Value.Substring(0,4) + "***" + $Value.Substring($Value.Length-4)
}

$needsEnv = $Show -or $Shell -or [bool]$Run

if (-not $needsEnv) {
    Write-Host "with-token.ps1 - inject git credentials from local file" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  -Show              Show loaded keys (values masked)"
    Write-Host "  -Shell             Open new PowerShell with tokens in scope"
    Write-Host "  -Run `"cmd args`"    Run one command with tokens expanded"
    Write-Host "  -EnvFile <path>    Use a different env file (default: .git-token)"
    Write-Host ""
    Write-Host "Quick start:" -ForegroundColor Yellow
    Write-Host "  cp .git-token.example .git-token" -ForegroundColor Yellow
    Write-Host "  # edit .git-token and fill in real tokens"
    Write-Host "  .\scripts\with-token.ps1 -Show" -ForegroundColor Yellow
    exit 1
}

Load-DotEnv -Path $EnvFile

if ($Show) {
    Write-Host "Loaded from $EnvFile (values masked):" -ForegroundColor Green
    foreach ($name in @("GH_TOKEN", "GITEE_TOKEN")) {
        $val = [Environment]::GetEnvironmentVariable($name, "Process")
        if ($val) {
            Write-Host ("  {0} = {1}" -f $name, (Format-Masked $val))
        } else {
            Write-Host "  $name = (not set)" -ForegroundColor DarkGray
        }
    }
    exit 0
}

if ($Shell) {
    Write-Host "Env loaded from $EnvFile." -ForegroundColor Green
    Write-Host "GH_TOKEN / GITEE_TOKEN are set in this shell. Type 'exit' to close." -ForegroundColor DarkGray
    powershell -NoExit
    exit 0
}

if ($Run) {
    Write-Host ">>> $Run" -ForegroundColor DarkGray
    Invoke-Expression $Run
    exit $LASTEXITCODE
}

Write-Host "with-token.ps1 - inject git credentials from local file" -ForegroundColor Cyan
Write-Host ""
Write-Host "  -Show              Show loaded keys (values masked)"
Write-Host "  -Shell             Open new PowerShell with tokens in scope"
Write-Host "  -Run `"cmd args`"    Run one command with tokens expanded"
Write-Host "  -EnvFile <path>    Use a different env file (default: .git-token)"
Write-Host ""
Write-Host "AI workflow: have AI draft the command (using `$GH_TOKEN` / `$GITEE_TOKEN`)," -ForegroundColor Yellow
Write-Host "then run it via: .\scripts\with-token.ps1 -Run `"<the-command>`"" -ForegroundColor Yellow
exit 1
