# release-ops.ps1 - Versioned releases for AI agents.
#
# Same security model as git-platform-ops / publish-ops: loads tokens from
# .git-token, never echoes secrets. AI agents suggest these commands instead
# of inline git/gh invocations.
#
# Subcommands:
#   notes [-Since TAG] [-Limit N] [-Format oneline|json]
#       List commits since the given tag (default: most recent tag, or HEAD
#       if no tags exist). Useful for changelog generation.
#
#   tag -Version V [-Message "..."] [-Push] [-DryRun] [-Sign] [-SignKey ID]
#       Create an annotated git tag. With -Push, also push to origin.
#       Version is validated as semver (X.Y.Z, optional -rc.N / -beta.N suffix).
#
#   release -Version V [-Title "..."] [-NotesFile PATH] [-Draft] [-DryRun] [-Sign] [-SignKey ID]
#
#   verify -Version V
#       Verify a signed tag's GPG signature.
#       Create a GitHub release for the given tag. Pushes the tag if needed,
#       then calls `gh release create`. Requires auth-gh to have been run
#       first, or pass -TokenFile to load GH_TOKEN inline.
#
# Semver check is permissive: 1.2.3, v1.2.3, 1.2.3-rc.1, 2.0.0-beta.2 all pass.
#
# Setup:
#   Tagging works without tokens. For `release`, run:
#     .\scripts\git-platform-ops.ps1 -Action auth-gh
#   first, or add GH_TOKEN to .git-token.

[CmdletBinding()]
param(
    [string]$Action,
    [string]$Version,
    [string]$Message,
    [string]$Since,
    [string]$NotesFile,
    [int]$Limit = 20,
    [ValidateSet('oneline', 'json')]
    [string]$Format = 'oneline',
    [string]$Title,
    [switch]$Help,
    [switch]$Push,
    [switch]$Draft,
    [switch]$DryRun,
    [switch]$Sign,
    [string]$SignKey,
    [string]$Remote = 'origin',
    [string]$TokenFile = '.git-token'
)

$ErrorActionPreference = 'Stop'

if ($Help -or $Action -eq 'help') {
    Get-Content $PSCommandPath -TotalCount 25 | ForEach-Object { Write-Host $_ }
    exit 0
}

if (-not $Action) {
    Get-Content $PSCommandPath -TotalCount 25 | ForEach-Object { Write-Host $_ }
    exit 1
}

$validActions = @('notes', 'tag', 'release', 'verify')
if ($Action -notin $validActions) {
    Write-Error "Unknown action: $Action. Use one of: $($validActions -join ', ')"
    exit 1
}

# ---- Helpers ----------------------------------------------------------------
function Test-Semver {
    param([string]$V)
    # Strip leading 'v'
    $V = $V -replace '^v', ''
    if ($V -match '^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$') { return $true }
    return $false
}

function Get-LastTag {
    try {
        $tag = git describe --tags --abbrev=0 2>$null
        if ($LASTEXITCODE -eq 0) { return $tag.Trim() }
    } catch {}
    return $null
}

function Get-NotesSince {
    param(
        [string]$SinceTag,
        [int]$Limit,
        [string]$Format
    )
    $pretty = '%H|%h|%an|%ae|%s|%ai'
    if ($Format -eq 'json') {
        # Build args as a single string to avoid PowerShell array-splat quoting
        # issues with refs that contain dots (e.g. "v1.2.0..HEAD").
        $range = if ($SinceTag) { "$SinceTag..HEAD" } else { '' }
        if ($range) {
            $raw = & git log $range --pretty=format:$pretty -n $Limit 2>$null
        } else {
            $raw = & git log --pretty=format:$pretty -n $Limit 2>$null
        }
        if ($raw) {
            $raw -split "`n" | ForEach-Object {
                $parts = $_ -split '\|', 6
                if ($parts.Count -eq 6) {
                    [PSCustomObject]@{
                        sha    = $parts[0]
                        short  = $parts[1]
                        author = $parts[2]
                        email  = $parts[3]
                        subject = $parts[4]
                        date   = $parts[5]
                    }
                }
            } | ConvertTo-Json -Compress
        } else {
            '[]'
        }
    } else {
        $range = if ($SinceTag) { "$SinceTag..HEAD" } else { '' }
        if ($range) {
            & git log $range --pretty=format:'%h %s' -n $Limit
        } else {
            & git log --pretty=format:'%h %s' -n $Limit
        }
    }
}

function Load-GhToken {
    if (-not (Test-Path $TokenFile)) {
        throw "Token file not found: $TokenFile. Run: cp .git-token.example $TokenFile"
    }
    Get-Content $TokenFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^GH_TOKEN=(.+)$') {
            $value = $Matches[1] -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable('GH_TOKEN', $value, 'Process')
        }
    }
    $tok = [Environment]::GetEnvironmentVariable('GH_TOKEN', 'Process')
    if (-not $tok) { throw "GH_TOKEN is empty in $TokenFile" }
    return $tok
}

# ---- Actions ----------------------------------------------------------------

switch ($Action) {

    'notes' {
        $since = if ($Since) { $Since } else { Get-LastTag }
        if ($Format -ne 'json') {
            # Print header to stderr so it doesn't pollute JSON output.
            if (-not $since) {
                [Console]::Error.WriteLine("(no previous tags; showing last $Limit commits)")
            } else {
                [Console]::Error.WriteLine("Commits since $since :")
            }
        }
        Get-NotesSince -SinceTag $since -Limit $Limit -Format $Format
    }

    'tag' {
        if (-not $Version) { Write-Error '-Version is required for tag'; exit 1 }
        $fullTag = if ($Version -match '^v') { $Version } else { "v$Version" }
        if (-not (Test-Semver $Version)) {
            Write-Error "Version '$Version' is not valid semver (expected: X.Y.Z or vX.Y.Z)"
            exit 1
        }

        # Refuse to overwrite an existing tag
        $existing = git tag -l $fullTag
        if ($existing) {
            Write-Error "Tag '$fullTag' already exists. Use a different version or delete it first."
            exit 1
        }

        $msg = if ($Message) { $Message } else { "Release $fullTag" }

        # Build tag command: -s (signed) or -a (annotated).
        if ($Sign) {
            $tagArgs = @('-s', $fullTag, '-m', $msg)
            if ($SignKey) { $tagArgs += @('-u', $SignKey) }
            $tagKind = 'signed'
        } else {
            $tagArgs = @('-a', $fullTag, '-m', $msg)
            $tagKind = 'annotated'
        }

        if ($DryRun) {
            Write-Host "[dry-run] git tag $($tagArgs -join ' ')" -ForegroundColor Yellow
            if ($Push) {
                Write-Host "[dry-run] git push $Remote $fullTag" -ForegroundColor Yellow
            }
            return
        }
        git tag @tagArgs
        if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
        Write-Host "Created $tagKind tag $fullTag"
        if ($Push) {
            Write-Host ">>> git push $Remote $fullTag" -ForegroundColor DarkGray
            git push $Remote $fullTag
            if ($LASTEXITCODE -ne 0) { throw "git push tag failed" }
            Write-Host "Pushed $fullTag to $Remote"
        }
    }

    'release' {
        if (-not $Version) { Write-Error '-Version is required for release'; exit 1 }
        $fullTag = if ($Version -match '^v') { $Version } else { "v$Version" }
        if (-not (Test-Semver $Version)) {
            Write-Error "Version '$Version' is not valid semver"
            exit 1
        }

        # Set up gh auth
        if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
            Write-Error "gh CLI not installed. Install: https://cli.github.com"
            exit 1
        }
        $tok = Load-GhToken
        $tok | gh auth login --with-token | Out-Null

        # Tag and push if not already
        $existing = git tag -l $fullTag
        if (-not $existing) {
            $msg = if ($Message) { $Message } else { "Release $fullTag" }
            if ($Sign) {
                $tagArgs = @('-s', $fullTag, '-m', $msg)
                if ($SignKey) { $tagArgs += @('-u', $SignKey) }
                $tagKind = 'signed'
            } else {
                $tagArgs = @('-a', $fullTag, '-m', $msg)
                $tagKind = 'annotated'
            }
            if ($DryRun) {
                Write-Host "[dry-run] git tag $($tagArgs -join ' ')" -ForegroundColor Yellow
            } else {
                git tag @tagArgs
                if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
                Write-Host "Created $tagKind tag $fullTag"
            }
        }
        # Push if not already on remote
        if (-not $DryRun) {
            $onRemote = git ls-remote --tags $Remote $fullTag 2>$null
            if (-not $onRemote) {
                git push $Remote $fullTag | Out-Null
                Write-Host "Pushed $fullTag to $Remote"
            }
        } else {
            Write-Host "[dry-run] git push $Remote $fullTag" -ForegroundColor Yellow
        }

        # Generate notes if not provided
        $notesPath = $NotesFile
        if (-not $notesPath) {
            $since = Get-LastTag
            # Use the second-most-recent tag as the "since" for this release
            $prevTag = git tag -l 'v*.*.*' --sort=-version:refname | Select-Object -Skip 1 -First 1
            if ($prevTag) { $since = $prevTag }
            $tmpNotes = [System.IO.Path]::GetTempFileName()
            Get-NotesSince -SinceTag $since -Limit $Limit -Format 'oneline' | Set-Content -Path $tmpNotes
            $notesPath = $tmpNotes
        }

        # Create the GitHub release
        $titleArg = if ($Title) { @('--title', $Title) } else { @('--title', "Release $fullTag") }
        $draftArg = if ($Draft) { @('--draft') } else { @() }

        if ($DryRun) {
            Write-Host "[dry-run] gh release create $fullTag --notes-file $notesPath $titleArg $draftArg" -ForegroundColor Yellow
        } else {
            Write-Host ">>> gh release create $fullTag" -ForegroundColor DarkGray
            gh release create $fullTag --notes-file $notesPath @titleArg @draftArg
            if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
            Write-Host "Released $fullTag"
        }

        # Cleanup temp notes
        if (-not $NotesFile -and (Test-Path $notesPath)) {
            Remove-Item $notesPath -Force -ErrorAction SilentlyContinue
        }
    }

    'verify' {
        if (-not $Version) { Write-Error '-Version is required for verify'; exit 1 }
        $fullTag = if ($Version -match '^v') { $Version } else { "v$Version" }
        $existing = git tag -l $fullTag
        if (-not $existing) {
            Write-Error "Tag '$fullTag' does not exist locally."
            exit 1
        }
        Write-Host ">>> git tag -v $fullTag" -ForegroundColor DarkGray
        # Disable GPG's interactive prompt; capture exit code.
        $env:GIT_TERMINAL_PROMPT = '0'
        git tag -v $fullTag
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: signature verified for $fullTag"
            exit 0
        } else {
            Write-Error "Signature check failed (exit $LASTEXITCODE)"
            exit 1
        }
    }
}
