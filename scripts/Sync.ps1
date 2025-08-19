# QuantEnergx auto-sync (Windows PowerShell)
# Usage:
#   - Run from PowerShell: & "scripts/Sync.ps1"
#   - Optional parameters: & "scripts/Sync.ps1" -Repo "C:\path\to\repo" -Branch "main"
# Notes:
#   - This script syncs your local working copy with origin/<branch>.
#   - It will create a commit only if you have local changes staged by the script.
#   - If your default branch is protected and requires PRs, do not run this on the protected branch.
#   - Ensure you are authenticated with GitHub (Git Credential Manager will prompt on first push).

param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# Basic checks
if (-not (Test-Path $Repo)) { Write-Error "Repo path not found: $Repo"; exit 1 }
if (-not (Test-Path (Join-Path $Repo ".git"))) { Write-Error "Not a git repository: $Repo"; exit 1 }

# Prevent running while a rebase is in progress
if (Test-Path (Join-Path $Repo ".git\rebase-apply")) { Write-Error "A rebase is in progress (.git\\rebase-apply). Resolve it, then re-run."; exit 1 }
if (Test-Path (Join-Path $Repo ".git\rebase-merge")) { Write-Error "A rebase is in progress (.git\\rebase-merge). Resolve it, then re-run."; exit 1 }

Write-Host "Syncing branch: $Branch in repo: $Repo"

# Fetch and rebase latest changes
git -C $Repo fetch origin --prune

# Ensure we are on the desired branch locally
$currBranch = (git -C $Repo rev-parse --abbrev-ref HEAD).Trim()
if ($currBranch -ne $Branch) {
  git -C $Repo checkout $Branch
}

# Pull with rebase to keep history linear
git -C $Repo pull --rebase origin $Branch

# Stage and commit local changes (only if any)
git -C $Repo add -A
# Check if anything is staged
$null = git -C $Repo diff --cached --quiet
$hasStagedChanges = ($LASTEXITCODE -ne 0)
if ($hasStagedChanges) {
  $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss") + " UTC"
  git -C $Repo commit -m "chore: auto-sync $ts"
}

# Push with one retry on failure (e.g., non-fast-forward)
$pushOk = $false
for ($i = 0; $i -lt 2 -and -not $pushOk; $i++) {
  try {
    git -C $Repo push origin $Branch
    $pushOk = $true
  } catch {
    Write-Warning "Push failed (attempt $($i+1)). Pulling latest and retrying..."
    git -C $Repo pull --rebase origin $Branch
  }
}

if (-not $pushOk) { Write-Error "Could not push changes. Resolve any conflicts and re-run."; exit 1 }

Write-Host "Sync complete."