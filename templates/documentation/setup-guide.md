# Development Environment Setup Guide

This guide provides step-by-step instructions for setting up your development environment using our configuration files.

## 1. VSCode Settings Setup

1. **Open VSCode Settings**
   - Press `Ctrl+Shift+P`
   - Type "settings json"
   - Select "Preferences: Open User Settings (JSON)"

2. **Copy Settings**
   - Copy the contents of `.vscode/settings.json`
   - Paste into your user settings JSON
   - Save the file

3. **Install Required Extensions**
   ```powershell
   # Run these commands in PowerShell
   code --install-extension GitHub.copilot
   code --install-extension eamodio.gitlens
   code --install-extension esbenp.prettier-vscode
   code --install-extension dbaeumer.vscode-eslint
   code --install-extension ritwickdey.LiveServer
   code --install-extension rangav.vscode-thunder-client
   code --install-extension PKief.material-icon-theme
   code --install-extension zhuangtongfa.material-theme
   code --install-extension yzhang.markdown-all-in-one
   ```

## 2. PowerShell Profile Setup

1. **Locate PowerShell Profile Directory**
   ```powershell
   # Check if profile exists
   Test-Path $PROFILE.CurrentUserAllHosts

   # Create profile directory if it doesn't exist
   if (!(Test-Path (Split-Path $PROFILE.CurrentUserAllHosts))) {
       New-Item -Type Directory -Path (Split-Path $PROFILE.CurrentUserAllHosts)
   }
   ```

2. **Install Required PowerShell Modules**
   ```powershell
   # Install modules
   Install-Module posh-git -Scope CurrentUser -Force
   Install-Module Terminal-Icons -Scope CurrentUser -Force
   ```

3. **Apply Profile**
   ```powershell
   # Copy profile
   Copy-Item "config/powershell/profile.ps1" $PROFILE.CurrentUserAllHosts

   # Reload profile
   . $PROFILE.CurrentUserAllHosts
   ```

## 3. Git Configuration Setup

1. **Configure User Information**
   ```powershell
   # Set your name and email
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Apply Git Configuration**
   ```powershell
   # Copy gitconfig content
   Get-Content "config/git/gitconfig" |
       Where-Object { !$_.StartsWith('#') -and $_.Trim() -ne '' } |
       ForEach-Object {
           if ($_ -match '^\s*\[.*\]') {
               $section = $_ -replace '[\[\]]',''
           } elseif ($_ -match '^\s*(\S+)\s*=\s*(.*)') {
               $key = $matches[1].Trim()
               $value = $matches[2].Trim()
               git config --global "$section.$key" $value
           }
       }
   ```

3. **Set Up Commit Message Template**
   ```powershell
   # Copy commit message template
   Copy-Item "config/git/gitmessage" "$HOME/.gitmessage"
   git config --global commit.template "$HOME/.gitmessage"
   ```

## 4. EditorConfig Setup

1. **Global EditorConfig**
   ```powershell
   # Copy to home directory for global use
   Copy-Item ".editorconfig" "$HOME/.editorconfig"
   ```

2. **Project-Specific Setup**
   - Copy `.editorconfig` to each project's root directory
   ```powershell
   function Add-EditorConfig {
       param([string]$projectPath)
       Copy-Item ".editorconfig" "$projectPath/.editorconfig"
   }
   ```

## 5. Verify Installation

1. **Check VSCode Extensions**
   ```powershell
   code --list-extensions
   ```

2. **Verify PowerShell Profile**
   ```powershell
   # Should show custom prompt and aliases
   Get-Alias
   ```

3. **Check Git Configuration**
   ```powershell
   git config --list
   ```

## Troubleshooting

1. **VSCode Settings Issues**
   - Delete existing settings and re-copy
   - Restart VSCode
   - Check extension compatibility

2. **PowerShell Profile Issues**
   ```powershell
   # Check execution policy
   Get-ExecutionPolicy
   # If restricted, run:
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Git Configuration Issues**
   ```powershell
   # Reset git config
   git config --global --reset
   # Re-apply configuration
   ```

## Maintenance

1. **Regular Updates**
   ```powershell
   # Update VSCode extensions
   code --list-extensions | ForEach-Object { code --install-extension $_ }

   # Update PowerShell modules
   Update-Module
   ```

2. **Backup Configuration**
   ```powershell
   # Create backup directory
   $backupDir = "$HOME/config-backup/$(Get-Date -Format 'yyyy-MM-dd')"
   New-Item -Type Directory -Path $backupDir -Force

   # Backup configurations
   Copy-Item $PROFILE.CurrentUserAllHosts "$backupDir/profile.ps1"
   Copy-Item "$HOME/.gitconfig" "$backupDir/gitconfig"
   Copy-Item "$HOME/.gitmessage" "$backupDir/gitmessage"
   Copy-Item "$HOME/.editorconfig" "$backupDir/editorconfig"
   ```

## Additional Resources

- [VSCode Documentation](https://code.visualstudio.com/docs)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Git Documentation](https://git-scm.com/doc)
- [EditorConfig Documentation](https://editorconfig.org)

## Cross-References
- [Development Environment Configuration](./dev-environment.md)
- [Development Workflow Patterns](../../patterns/workflow/development-workflow.md)
- [Git Configuration Template](../../config/git/gitconfig)
