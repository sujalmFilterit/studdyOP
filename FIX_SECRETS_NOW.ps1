# PowerShell Script to Fix GitHub Secret Issue
# This creates a completely clean branch with NO history

Write-Host "=== Fixing GitHub Secret Issue ===" -ForegroundColor Green
Write-Host ""

# Check if we're in a git repo
if (-not (Test-Path .git)) {
    Write-Host "ERROR: Not in a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking current status..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Step 2: Staging all current changes..." -ForegroundColor Cyan
git add -A

Write-Host ""
Write-Host "Step 3: Creating orphan branch (no history)..." -ForegroundColor Cyan
git checkout --orphan clean-main

Write-Host ""
Write-Host "Step 4: Staging all files..." -ForegroundColor Cyan
git add -A

Write-Host ""
Write-Host "Step 5: Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit: Clean codebase without secrets"

Write-Host ""
Write-Host "Step 6: Pushing clean branch..." -ForegroundColor Cyan
Write-Host "Pushing to: origin clean-main" -ForegroundColor Yellow
git push origin clean-main

Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your clean branch 'clean-main' has been pushed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub and set 'clean-main' as your default branch" -ForegroundColor White
Write-Host "2. Delete the old branch with secrets (optional)" -ForegroundColor White
Write-Host "3. Rotate your HuggingFace token at: https://huggingface.co/settings/tokens" -ForegroundColor White
Write-Host ""

