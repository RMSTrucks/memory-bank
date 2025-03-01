# VSCode Shell Integration Fix

This repository contains scripts and documentation to help fix the "Shell Integration Unavailable" issue in VSCode, which prevents Cline from seeing the output of commands executed in the terminal.

## Files in this Repository

- `shell-integration-troubleshooting.md` - Comprehensive troubleshooting guide with various solutions to try
- `setup-no-profile-terminal.ps1` - PowerShell script to set up a "No Profile" terminal profile in VSCode
- `run-with-output.ps1` - PowerShell script to run commands and capture their output to a file
- `test-shell-integration.js` - JavaScript test script to verify shell integration
- `test-shell-integration.ps1` - PowerShell test script to verify shell integration
- `test-shell-integration.bat` - Batch file test script to verify shell integration

## Quick Start

### Option 1: Set Up a "No Profile" Terminal

This option creates a new terminal profile that doesn't load your custom PowerShell profile, which might be causing the shell integration issue.

1. Run the setup script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup-no-profile-terminal.ps1
   ```

2. Restart VSCode

3. Test shell integration:
   ```powershell
   node test-shell-integration.js
   ```

### Option 2: Use the Output Capture Workaround

This option allows you to run commands and see their output even if shell integration is not working.

1. Run a command and capture its output:
   ```powershell
   powershell -ExecutionPolicy Bypass -File run-with-output.ps1 "node test-shell-integration.js"
   ```

2. The script will run the command, save the output to a file, and display it in the terminal

## Detailed Troubleshooting

For more detailed troubleshooting steps, please refer to the `shell-integration-troubleshooting.md` file.

## Common Issues and Solutions

### Custom PowerShell Profile

The custom prompt in your PowerShell profile might be interfering with shell integration. The `setup-no-profile-terminal.ps1` script creates a terminal profile that doesn't load your custom profile.

### VSCode Settings

Make sure shell integration is enabled in your VSCode settings:

```json
"terminal.integrated.shellIntegration.enabled": true
```

### VSCode Version

Make sure you're using the latest version of VSCode. You can check for updates by pressing `Ctrl+Shift+P` and typing "Check for Updates".

### Terminal Profile

Make sure you're using a supported shell: zsh, bash, fish, or PowerShell. You can change your default terminal profile by pressing `Ctrl+Shift+P` and typing "Terminal: Select Default Profile".
