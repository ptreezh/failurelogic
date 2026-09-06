# publish-ops.ps1 - Authenticated package publishing for AI agents.
#
# Same security model as git-platform-ops: loads tokens from .git-token
# (gitignored), never echoes secrets in chat or command history. AI agents
# suggest these commands instead of inline tokens or registry URLs.
#
# Subcommands:
#   docker-build -Image NAME [-Tag VERSION] [-Dockerfile PATH]
#       Build a Docker image. Defaults to latest tag and ./Dockerfile.
#
#   docker-push -Image NAME [-Tag VERSION]
#       Login to a registry (Docker Hub by default) and push.
#       Requires DOCKERHUB_USERNAME and DOCKERHUB_TOKEN in .git-token.
#
#   npm-publish [-Tag VERSION] [-Registry URL]
#       Publish an npm package. Requires NPM_TOKEN in .git-token.
#       Writes a temp .npmrc that's removed on exit.
#
# Setup:
#   Add the relevant tokens to .git-token (see .git-token.example):
#     DOCKERHUB_USERNAME=your_dockerhub_user
#     DOCKERHUB_TOKEN=dckr_pat_xxx
#     NPM_TOKEN=npm_xxx

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('docker-build', 'docker-push', 'npm-publish')]
    [string]$Action,

    [string]$Image,
    [string]$Tag = 'latest',
    [string]$Dockerfile = 'Dockerfile',
    [string]$Registry = 'docker.io',
    [string]$NpmRegistry = 'https://registry.npmjs.org',
    [string]$TokenFile = '.git-token'
)

$ErrorActionPreference = 'Stop'

# ---- Token loading ----------------------------------------------------------
function Load-TokenVar {
    param([string]$Path, [string]$VarName)
    if (-not (Test-Path $Path)) {
        throw "Token file not found: $Path. Run: cp .git-token.example $TokenFile"
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
    if (-not $v) { throw "$VarName is empty in $TokenFile. Add it to your token file." }
    return $v
}

foreach ($n in 'DOCKERHUB_USERNAME', 'DOCKERHUB_TOKEN', 'NPM_TOKEN') {
    Load-TokenVar -Path $TokenFile -VarName $n | Out-Null
}

# ---- Actions ----------------------------------------------------------------

switch ($Action) {

    'docker-build' {
        if (-not $Image) { Write-Error '-Image is required for docker-build'; exit 1 }
        if (-not (Test-Path $Dockerfile)) {
            throw "Dockerfile not found: $Dockerfile"
        }
        $fullTag = if ($Image -match '/') { "${Image}:${Tag}" } else { "${Registry}/${Image}:${Tag}" }
        Write-Host ">>> docker build -t $fullTag -f $Dockerfile ." -ForegroundColor DarkGray
        docker build -t $fullTag -f $Dockerfile .
        if ($LASTEXITCODE -ne 0) { throw "docker build failed" }
        Write-Host "Built $fullTag"
    }

    'docker-push' {
        if (-not $Image) { Write-Error '-Image is required for docker-push'; exit 1 }
        $user = Get-Token -VarName 'DOCKERHUB_USERNAME'
        $tok  = Get-Token -VarName 'DOCKERHUB_TOKEN'
        $fullTag = if ($Image -match '/') { "${Image}:${Tag}" } else { "${Registry}/${Image}:${Tag}" }

        # Use --password-stdin to keep token out of ps output.
        Write-Host ">>> docker login $Registry (user: $user)" -ForegroundColor DarkGray
        $tok | docker login $Registry --username $user --password-stdin
        if ($LASTEXITCODE -ne 0) { throw "docker login failed" }

        Write-Host ">>> docker push $fullTag" -ForegroundColor DarkGray
        docker push $fullTag
        if ($LASTEXITCODE -ne 0) { throw "docker push failed" }
        Write-Host "Pushed $fullTag"
    }

    'npm-publish' {
        if (-not (Test-Path 'package.json')) {
            throw "package.json not found. Run from a Node.js project root."
        }
        $tok = Get-Token -VarName 'NPM_TOKEN'

        # Use a temp userconfig so we never touch the project's .npmrc.
        # Cleaned up in the finally block.
        $userconfig = Join-Path ([System.IO.Path]::GetTempPath()) "npmrc_$([System.Guid]::NewGuid()).tmp"
        @"
;registry=$NpmRegistry/
//$NpmRegistry/:_authToken=$tok
"@ | Set-Content -Path $userconfig

        try {
            Write-Host ">>> npm publish --tag $Tag --userconfig $userconfig" -ForegroundColor DarkGray
            npm publish --tag $Tag --userconfig $userconfig --registry $NpmRegistry
            if ($LASTEXITCODE -ne 0) { throw "npm publish failed" }
            Write-Host "Published to $NpmRegistry with tag $Tag"
        } finally {
            Remove-Item $userconfig -Force -ErrorAction SilentlyContinue
        }
    }
}
