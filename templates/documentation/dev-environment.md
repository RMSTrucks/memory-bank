# Development Environment Setup

## VSCode Configuration

### Essential Extensions

1. **Development**
   - GitHub Copilot
   - GitLens
   - ESLint
   - Prettier
   - Live Server
   - Thunder Client
   - Code Spell Checker

2. **Language Support**
   - Python
   - JavaScript and TypeScript
   - Markdown All in One
   - YAML
   - Docker

3. **Themes and UI**
   - Material Icon Theme
   - One Dark Pro

### VSCode Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.rulers": [80, 100],
  "editor.minimap.enabled": true,
  "editor.wordWrap": "on",
  "editor.tabSize": 2,
  "editor.suggestSelection": "first",
  "editor.snippetSuggestions": "top",
  
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "One Dark Pro",
  "workbench.editor.enablePreview": false,
  
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.fontFamily": "CaskaydiaCove Nerd Font",
  
  "git.enableSmartCommit": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5",
  
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Keyboard Shortcuts

```json
{
  "key": "ctrl+shift+/",
  "command": "editor.action.blockComment",
  "when": "editorTextFocus && !editorReadonly"
},
{
  "key": "ctrl+k ctrl+f",
  "command": "editor.action.formatSelection",
  "when": "editorHasDocumentSelectionFormattingProvider && editorTextFocus && !editorReadonly"
},
{
  "key": "ctrl+k ctrl+r",
  "command": "workbench.action.reloadWindow",
  "when": "isDevelopment"
}
```

## PowerShell Configuration

### Profile Setup

```powershell
# User profile for PowerShell
# Save as: $PROFILE.CurrentUserAllHosts

# Import modules
Import-Module posh-git
Import-Module Terminal-Icons

# Set encoding
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

# Aliases
Set-Alias -Name g -Value git
Set-Alias -Name touch -Value New-Item
Set-Alias -Name ll -Value Get-ChildItem

# Functions
function which ($command) {
  Get-Command -Name $command -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty Path -ErrorAction SilentlyContinue
}

# Git shortcuts
function gs { git status }
function ga { git add $args }
function gc { git commit -m $args }
function gp { git push }
function gl { git pull }
```

## Git Configuration

### Global Settings

```bash
# User configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Default branch
git config --global init.defaultBranch main

# Core settings
git config --global core.editor "code --wait"
git config --global core.autocrlf input

# Aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
```

### Git Commit Template

```
# If applied, this commit will...

# Why is this change needed?

# How does it address the issue?

# Any references to tickets, articles etc?
```

Save as `~/.gitmessage` and configure:
```bash
git config --global commit.template ~/.gitmessage
```

## Required Tools

1. **Node.js and npm**
   - Download and install from: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Python**
   - Download and install from: https://www.python.org/
   - Verify installation:
     ```bash
     python --version
     pip --version
     ```

3. **Git**
   - Download and install from: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version
     ```

## Project Setup Script

```powershell
function Initialize-Project {
  param(
    [string]$ProjectName,
    [string]$Template = "default"
  )
  
  # Create project directory
  New-Item -ItemType Directory -Path $ProjectName
  Set-Location $ProjectName
  
  # Initialize git
  git init
  
  # Create standard directories
  $directories = @(
    "src",
    "tests",
    "docs",
    "scripts"
  )
  
  foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir
  }
  
  # Create initial files
  New-Item -ItemType File -Path "README.md"
  New-Item -ItemType File -Path ".gitignore"
  New-Item -ItemType File -Path "LICENSE"
  
  # Initialize npm if needed
  if ($Template -eq "node") {
    npm init -y
  }
  
  Write-Host "Project $ProjectName initialized successfully!"
}
```

## Maintenance

1. **Regular Updates**
   - VSCode and extensions
   - Node.js and npm packages
   - Python and pip packages
   - Git

2. **Backup**
   - VSCode settings sync
   - PowerShell profile backup
   - Git configuration backup

3. **Security**
   - Keep all tools updated
   - Regular security audits
   - SSH key rotation
   - Token management

## Cross-References
- [Project Templates](../project/_index.md)
- [Workflow Patterns](../../patterns/workflow/_index.md)
- [Development Tools](../../library/references/tools/_index.md)
