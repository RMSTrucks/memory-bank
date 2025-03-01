# PowerShell Profile Configuration
# To use: Copy to $PROFILE.CurrentUserAllHosts (typically: %UserProfile%\Documents\PowerShell\profile.ps1)

# Import required modules (install if not present)
$requiredModules = @('posh-git', 'Terminal-Icons')
foreach ($module in $requiredModules) {
    if (!(Get-Module -ListAvailable -Name $module)) {
        Write-Host "Installing module: $module"
        Install-Module $module -Scope CurrentUser -Force
    }
    Import-Module $module
}

# Set encoding for proper character display
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

# Custom prompt with git status
function prompt {
    $location = Get-Location
    $gitStatus = Get-GitStatus
    $promptChar = "❯"

    Write-Host ""
    Write-Host "$([char]0x1B)[36m$location$([char]0x1B)[0m" -NoNewline

    if ($gitStatus) {
        $branch = $gitStatus.Branch
        Write-Host " $([char]0x1B)[35mgit:($branch)$([char]0x1B)[0m" -NoNewline
    }

    Write-Host ""
    "$promptChar "
}

# Aliases
Set-Alias -Name g -Value git
Set-Alias -Name touch -Value New-Item
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name which -Value Get-Command

# Git shortcuts
function gs { git status }
function ga { git add $args }
function gc { git commit -m $args }
function gp { git push }
function gl { git pull }
function gd { git diff }
function gb { git branch }
function gco { git checkout $args }
function grb { git rebase $args }

# Utility functions
function New-Directory-And-Enter {
    param($path)
    New-Item -ItemType Directory -Path $path
    Set-Location $path
}
Set-Alias -Name mkcd -Value New-Directory-And-Enter

# Project navigation
$projectsRoot = "C:\Users\jaked\Projects"  # Adjust path as needed
function goto {
    param($project)
    $projectPath = Join-Path $projectsRoot $project
    if (Test-Path $projectPath) {
        Set-Location $projectPath
    } else {
        Write-Host "Project not found: $project"
    }
}

# Development shortcuts
function serve {
    param($port = 8000)
    python -m http.server $port
}

function npmdev {
    npm run dev
}

function update-deps {
    if (Test-Path package.json) {
        npm update
    }
    if (Test-Path requirements.txt) {
        pip install -r requirements.txt --upgrade
    }
}

# Environment helper
function Show-EnvVars {
    Get-ChildItem env:
}

# Quick edit profile
function Edit-Profile {
    code $PROFILE.CurrentUserAllHosts
}

# Reload profile
function Reload-Profile {
    . $PROFILE.CurrentUserAllHosts
    Write-Host "PowerShell profile reloaded!"
}

# Initialize environment
Clear-Host
Write-Host "PowerShell Environment Loaded!" -ForegroundColor Green
Write-Host "Type 'Get-Alias' to see available aliases" -ForegroundColor Yellow
