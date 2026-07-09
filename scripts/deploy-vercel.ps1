<#
deploy-vercel.ps1

Automates: create GitHub repo (using gh CLI) and push current project.
Then generates a `vercel-setup.txt` with exact commands to run to finish deployment
and set environment variables using the Vercel CLI or Vercel dashboard.

Prerequisites (install if missing):
- Git
- GitHub CLI (`gh`) and be logged in: `gh auth login`
- (optional) Vercel CLI (`npm i -g vercel`) and be logged in: `vercel login`

Run:
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1
#>

Set-StrictMode -Version Latest

function Abort($msg){ Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Check for gh
if (-not (Get-Command gh -ErrorAction SilentlyContinue)){
    Abort "GitHub CLI 'gh' is not installed. Install from https://cli.github.com/ and run 'gh auth login' first."
}

# Ensure we're in the repo root
$repoRoot = Resolve-Path "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\.."
Set-Location $repoRoot

Write-Host "Repository path: $repoRoot"

# Ask for repo name
$defaultName = Split-Path -Leaf $repoRoot
$repoName = Read-Host "Enter GitHub repo name (owner/name or name). Default: $defaultName"
if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = $defaultName }

Write-Host "Creating GitHub repository: $repoName"

try {
    # Create repo and push current code
    gh repo create $repoName --public --source . --remote origin --push --confirm
    Write-Host "Repository created and pushed to GitHub." -ForegroundColor Green
} catch {
    Write-Host "gh repo create failed or repo may already exist. Attempting to set remote and push." -ForegroundColor Yellow
    git remote remove origin -ErrorAction SilentlyContinue
    git remote add origin "git@github.com:$repoName.git"
    git branch -M main
    git push -u origin main
    Write-Host "Pushed to origin/main." -ForegroundColor Green
}

# Generate Vercel setup instructions file
$setupFile = Join-Path $repoRoot 'vercel-setup.txt'

$content = @()
$content += "Vercel deployment instructions for orvion-crm"
$content += "========================================="
$content += ""
$content += "1) Install and login to Vercel CLI (if not already):"
$content += "   npm i -g vercel"
$content += "   vercel login"
$content += ""
$content += "2) (Optional) Import the GitHub repo in the Vercel dashboard or link from CLI:" 
$content += "   - Dashboard: https://vercel.com/new -> Import Git Repository -> select $repoName"
$content += "   - OR using CLI from your local machine after logging in:" 
$content += "       vercel git connect"
$content += ""
$content += "3) Set environment variables (recommended via Vercel dashboard or CLI):"
$content += "   In Vercel Project Settings -> Environment Variables, add the following (Production):"
$content += "     DATABASE_URL = <your Postgres connection string>"
$content += "     JWT_SECRET   = <a strong secret>"
$content += "     NODE_ENV     = production"
$content += ""
$content += "   Or using the Vercel CLI interactively (run these and paste the values when prompted):"
$content += "       vercel env add DATABASE_URL production"
$content += "       vercel env add JWT_SECRET production"
$content += "       vercel env add NODE_ENV production"
$content += ""
$content += "4) Set Build Command in Vercel to: npm run vercel-build"
$content += "   (We added this script to run Prisma migrations and build.)"
$content += ""
$content += "5) Deploy (from CLI) to production (after envs added):"
$content += "       vercel --prod"
$content += ""
$content += "6) Add your custom domain in Vercel: crm.theorviongroup.com -> follow DNS instructions provided by Vercel."
$content += ""
$content += "Notes:" 
$content += " - You need a hosted Postgres (Supabase/Neon/PlanetScale) because SQLite is not persistent on Vercel." 
$content += " - If Prisma migrations fail during build, run 'npx prisma migrate deploy' once against your DB."

$content | Out-File -FilePath $setupFile -Encoding UTF8

Write-Host "Created setup file: $setupFile" -ForegroundColor Green
Write-Host "Open the file and follow the steps. If you want, run 'vercel --prod' locally to deploy now." -ForegroundColor Cyan

Write-Host "Done. If you want, paste here the GitHub repo URL and I can verify the next steps." -ForegroundColor Green
