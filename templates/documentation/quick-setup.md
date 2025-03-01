# Quick Setup Guide

## 1. VSCode Extensions
Install these extensions from VSCode's Extensions panel (Ctrl+Shift+X):
- GitHub Copilot
- GitLens
- Prettier
- ESLint
- Live Server
- Thunder Client
- Material Icon Theme
- One Dark Pro
- Markdown All in One

## 2. VSCode Settings

1. Open Command Palette (Ctrl+Shift+P)
2. Type "settings json"
3. Select "Preferences: Open User Settings (JSON)"
4. Copy this content:

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
  "workbench.editor.enablePreview": false,

  "terminal.integrated.defaultProfile.windows": "PowerShell",

  "git.enableSmartCommit": true,
  "git.autofetch": true,
  "git.confirmSync": false,

  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5"
}
```

## 3. PowerShell Setup

1. Open PowerShell as Administrator and run:
```powershell
# Set execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install required modules
Install-Module posh-git -Scope CurrentUser -Force
Install-Module Terminal-Icons -Scope CurrentUser -Force

# Create profile directory if needed
$profileDir = Split-Path $PROFILE.CurrentUserAllHosts
if (!(Test-Path $profileDir)) {
    New-Item -Type Directory -Path $profileDir
}

# Copy profile
Copy-Item "config/powershell/profile.ps1" $PROFILE.CurrentUserAllHosts

# Reload profile
. $PROFILE.CurrentUserAllHosts
```

## 4. Git Configuration

1. Set your Git identity:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

2. Set up commit template:
```powershell
# Create .git-templates directory
New-Item -Type Directory -Path "$HOME/.git-templates" -Force

# Copy commit message template
Copy-Item "config/git/gitmessage" "$HOME/.gitmessage"
git config --global commit.template "$HOME/.gitmessage"
```

3. Apply core settings:
```powershell
git config --global core.editor "code --wait"
git config --global core.autocrlf input
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global push.default current
```

## 5. EditorConfig Setup

```powershell
# Copy to home directory
Copy-Item ".editorconfig" "$HOME/.editorconfig"
```

## Verification Steps

1. **Check PowerShell Setup**
```powershell
# Should show custom prompt and new aliases
Get-Module posh-git
Get-Module Terminal-Icons
Get-Alias
```

2. **Check Git Configuration**
```powershell
git config --list
```

3. **Check VSCode**
- Open VSCode
- Verify extensions are installed
- Verify settings are applied
- Open a Markdown file to test formatting

## Troubleshooting

If you encounter issues:

1. **PowerShell Profile Issues**
```powershell
# Check execution policy
Get-ExecutionPolicy
# Should be RemoteSigned or less restrictive
```

2. **Git Configuration Issues**
```powershell
# Reset git config if needed
git config --global --reset
# Then reapply configurations
```

3. **VSCode Issues**
- Try reloading VSCode (Ctrl+Shift+P, then "Reload Window")
- Check extension compatibility in Output panel
- Verify settings.json syntax
