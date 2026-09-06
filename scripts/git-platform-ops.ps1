# git-platform-ops.ps1 - Authenticated GitHub/Gitee operations for AI agents.
#
# Why: AI tools (Claude, Doubao, etc.) should never see raw tokens. This script
# loads tokens from .git-token (gitignored), auto-detects GitHub vs Gitee from
# the git remote URL, and dispatches to the right backend (gh CLI for GitHub,
# REST API for Gitee). AI agents invoke subcommands here instead of raw git/gh.
#
# Subcommands:
#   auth-status                                  Show loaded tokens (masked)
#   info                                         Show current repo + platform
#   push [-Branch X] [-Remote Y]                 git push with injected auth
#   pr-create -Title "..." -Body "..." -Base main  Create a PR
#   pr-list [-Limit N]                           List open PRs
#   issue-create -Title "..." -Body "..."        Create an issue
#   issue-list [-Limit N]                        List open issues
#
# First-time setup:
#   cp .git-token.example .git-token
#   # fill in tokens (see .git-token.example for guidance)

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('auth-status', 'info', 'push', 'pr-create', 'pr-list', 'issue-create', 'issue-list')]
    [string]$Action,

    [string]$Remote = 'origin',
    [string]$Branch,
    [string]$Title,
    [string]$Body,
    [string]$Base,
    [int]$Limit = 10,
    [string]$TokenFile = '.git-token'
)

$ErrorActionPreference = 'Stop'

# ---- Token loading ----------------------------------------------------------

function Load-TokenVar {
    param([string]$Path, [string]$VarName)
    if (-not (Test-Path $Path)) {
        throw "Token file not found: $Path. Run: cp .git-token.example .git-token"
    }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^$VarName=(.+)$") {
            $value = $Matches[1] -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($VarName, $value, 'Process')
            return
        }
    }
}

function Get-Token {
    param([string]$VarName)
    $v = [Environment]::GetEnvironmentVariable($VarName, 'Process')
    if (-not $v) { throw "$VarName is empty in $TokenFile. Check your token file." }
    return $v
}

function Format-Masked {
    param([string]$Value)
    if ([string]::IsNullOrEmpty($Value) -or $Value.Length -le 8) { return '***' }
    return $Value.Substring(0, 4) + '***' + $Value.Substring($Value.Length - 4)
}

# ---- Remote URL parsing -----------------------------------------------------

function Get-RemoteUrl {
    param([string]$RemoteName)
    $url = git remote get-url $RemoteName 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot read remote '$RemoteName'. Are you inside a git repo?"
    }
    return $url.Trim()
}

function Get-Platform {
    param([string]$Url)
    if ($Url -match 'github\.com') { return 'github' }
    if ($Url -match 'gitee\.com') { return 'gitee' }
    throw "Unsupported platform in remote URL: $Url. Only github.com and gitee.com are supported."
}

function Get-OwnerRepo {
    param([string]$Url)
    # Handle https://github.com/owner/repo.git and git@github.com:owner/repo.git
    if ($Url -match '(?:[:/]([^/:]+)/([^/]+?)(?:\.git)?)/?$') {
        return @{ Owner = $Matches[1]; Repo = $Matches[2] }
    }
    throw "Cannot parse owner/repo from: $Url"
}

# ---- API helpers ------------------------------------------------------------

function Invoke-GiteeApi {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body
    )
    $token = Get-Token -VarName 'GITEE_TOKEN'
    $uri = "https://gitee.com/api/v5$Path"
    $headers = @{
        'Authorization'  = "token $token"
        'Content-Type'   = 'application/json;charset=UTF-8'
        'User-Agent'     = 'git-platform-ops'
    }
    $params = @{
        Uri             = $uri
        Method          = $Method
        Headers         = $headers
        UseBasicParsing = $true
    }
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 5 -Compress)
    }
    $resp = Invoke-WebRequest @params
    return ($resp.Content | ConvertFrom-Json)
}

function Invoke-GithubApi {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body
    )
    $token = Get-Token -VarName 'GH_TOKEN'
    $uri = "https://api.github.com$Path"
    $headers = @{
        'Authorization'        = "Bearer $token"
        'Accept'               = 'application/vnd.github+json'
        'X-GitHub-Api-Version' = '2022-11-28'
        'User-Agent'           = 'git-platform-ops'
    }
    $params = @{
        Uri             = $uri
        Method          = $Method
        Headers         = $headers
        UseBasicParsing = $true
    }
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 5 -Compress)
    }
    $resp = Invoke-WebRequest @params
    return ($resp.Content | ConvertFrom-Json)
}

# ---- Load tokens only for actions that need them ----------------------------

$needsAuth = $Action -in 'auth-status', 'push', 'pr-create', 'pr-list', 'issue-create', 'issue-list'
if ($needsAuth) {
    foreach ($n in 'GH_TOKEN', 'GITEE_TOKEN') {
        Load-TokenVar -Path $TokenFile -VarName $n | Out-Null
    }
}

# ---- Actions ----------------------------------------------------------------

switch ($Action) {

    'auth-status' {
        Write-Host "Loaded from $TokenFile (values masked):" -ForegroundColor Green
        foreach ($n in 'GH_TOKEN', 'GITEE_TOKEN') {
            $v = [Environment]::GetEnvironmentVariable($n, 'Process')
            if ($v) {
                Write-Host ("  {0} = {1}" -f $n, (Format-Masked $v))
            } else {
                Write-Host "  $n = (not set)" -ForegroundColor DarkGray
            }
        }
    }

    'info' {
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url      $url
            $or   = Get-OwnerRepo  -Url      $url
            $cur  = git branch --show-current
            Write-Host "Remote:    $Remote -> $url"
            Write-Host "Platform:  $plat"
            Write-Host "Owner:     $($or.Owner)"
            Write-Host "Repo:      $($or.Repo)"
            Write-Host "Branch:    $cur"
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }

    'push' {
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url $url
            $b    = if ($Branch) { $Branch } else { git branch --show-current }
            if ($plat -eq 'github') {
                $tok = Get-Token -VarName 'GH_TOKEN'
                $auth = $url -replace '^https://', "https://x-access-token:$tok@"
            } else {
                $tok = Get-Token -VarName 'GITEE_TOKEN'
                $auth = $url -replace '^https://', "https://oauth2:$tok@"
            }
            Write-Host ">>> git push $Remote $b" -ForegroundColor DarkGray
            git push $auth $b
            if ($LASTEXITCODE -ne 0) { throw "git push failed" }
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }

    'pr-create' {
        if (-not $Title) { Write-Error '-Title is required for pr-create'; exit 1 }
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url $url
            $or   = Get-OwnerRepo  -Url $url
            $head = if ($Branch) { $Branch } else { git branch --show-current }
            $base = if ($Base)   { $Base   } else { 'main' }

            if ($plat -eq 'github') {
                if (Get-Command gh -ErrorAction SilentlyContinue) {
                    $bodyText = if ($Body) { $Body } else { '' }
                    gh pr create --title $Title --body $bodyText --base $base --head $head --repo "$($or.Owner)/$($or.Repo)"
                } else {
                    $resp = Invoke-GithubApi -Method POST `
                        -Path "/repos/$($or.Owner)/$($or.Repo)/pulls" `
                        -Body @{ title = $Title; body = $Body; head = $head; base = $base }
                    Write-Host "PR created: $($resp.html_url)"
                }
            } else {
                $resp = Invoke-GiteeApi -Method POST `
                    -Path "/repos/$($or.Owner)/$($or.Repo)/pulls" `
                    -Body @{ title = $Title; body = $Body; head = $head; base = $base; source_branch = $head; target_branch = $base }
                Write-Host "PR created: $($resp.html_url)"
            }
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }

    'pr-list' {
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url $url
            $or   = Get-OwnerRepo  -Url $url

            if ($plat -eq 'github') {
                if (Get-Command gh -ErrorAction SilentlyContinue) {
                    gh pr list --repo "$($or.Owner)/$($or.Repo)" --limit $Limit
                } else {
                    $resp = Invoke-GithubApi -Method GET -Path "/repos/$($or.Owner)/$($or.Repo)/pulls?per_page=$Limit"
                    $resp | ForEach-Object {
                        "#$($_.number) [$($_.state)] $($_.title) - $($_.html_url)"
                    }
                }
            } else {
                $resp = Invoke-GiteeApi -Method GET -Path "/repos/$($or.Owner)/$($or.Repo)/pulls?state=open&per_page=$Limit"
                $resp | ForEach-Object {
                    "#$($_.number) [$($_.state)] $($_.title) - $($_.html_url)"
                }
            }
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }

    'issue-create' {
        if (-not $Title) { Write-Error '-Title is required for issue-create'; exit 1 }
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url $url
            $or   = Get-OwnerRepo  -Url $url

            if ($plat -eq 'github') {
                if (Get-Command gh -ErrorAction SilentlyContinue) {
                    $bodyText = if ($Body) { $Body } else { '' }
                    gh issue create --title $Title --body $bodyText --repo "$($or.Owner)/$($or.Repo)"
                } else {
                    $resp = Invoke-GithubApi -Method POST `
                        -Path "/repos/$($or.Owner)/$($or.Repo)/issues" `
                        -Body @{ title = $Title; body = $Body }
                    Write-Host "Issue created: $($resp.html_url)"
                }
            } else {
                $resp = Invoke-GiteeApi -Method POST `
                    -Path "/repos/$($or.Owner)/$($or.Repo)/issues" `
                    -Body @{ title = $Title; body = $Body }
                Write-Host "Issue created: $($resp.url)"
            }
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }

    'issue-list' {
        try {
            $url  = Get-RemoteUrl -RemoteName $Remote
            $plat = Get-Platform   -Url $url
            $or   = Get-OwnerRepo  -Url $url

            if ($plat -eq 'github') {
                if (Get-Command gh -ErrorAction SilentlyContinue) {
                    gh issue list --repo "$($or.Owner)/$($or.Repo)" --limit $Limit
                } else {
                    $resp = Invoke-GithubApi -Method GET -Path "/repos/$($or.Owner)/$($or.Repo)/issues?per_page=$Limit"
                    $resp | ForEach-Object {
                        "#$($_.number) [$($_.state)] $($_.title) - $($_.html_url)"
                    }
                }
            } else {
                $resp = Invoke-GiteeApi -Method GET -Path "/repos/$($or.Owner)/$($or.Repo)/issues?state=open&per_page=$Limit"
                $resp | ForEach-Object {
                    "#$($_.number) [$($_.state)] $($_.title) - $($resp.html_url)"
                }
            }
        } catch {
            Write-Error $_.Exception.Message; exit 1
        }
    }
}
