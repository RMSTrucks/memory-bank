# Shell Integration Troubleshooting Guide

## Issue Description

The VSCode shell integration is currently unavailable, resulting in the following error message:

```
Shell Integration Unavailable
Cline won't be able to view the command's output. Please update VSCode (CMD/CTRL + Shift + P → "Update") and make sure you're using a supported shell: zsh, bash, fish, or PowerShell (CMD/CTRL + Shift + P → "Terminal: Select Default Profile"). Still having trouble?
```

This prevents Cline from seeing the output of commands executed in the terminal, which can make it difficult to troubleshoot issues or verify the results of commands.

## Attempted Solutions

We've already tried the following solutions:

1. **Enabling Shell Integration in Settings**
   - Added `"terminal.integrated.shellIntegration.enabled": true` to both project and user settings
   - Added explicit PowerShell profile configuration to both project and user settings

2. **Testing with Different Script Types**
   - JavaScript script (test-shell-integration.js)
   - PowerShell script (test-shell-integration.ps1)
   - Batch file (test-shell-integration.bat)

None of these solutions resolved the issue.

## Recommended Solutions

Here are some additional steps to try:

1. **Restart VSCode**
   - Sometimes settings changes require a restart to take effect
   - Close and reopen VSCode completely

2. **Update VSCode**
   - As suggested in the error message, update VSCode to the latest version
   - CMD/CTRL + Shift + P → type "Check for Updates" or "Update"

3. **Try a Different Terminal Profile**
   - CMD/CTRL + Shift + P → "Terminal: Select Default Profile"
   - Try selecting a different supported shell (zsh, bash, fish, or PowerShell)

4. **Check PowerShell Version**
   - Run `$PSVersionTable` in PowerShell to check the version
   - Shell integration works best with PowerShell 7+

5. **Temporarily Disable Custom PowerShell Profile**
   - The custom prompt in your PowerShell profile might be interfering with shell integration
   - Try running PowerShell with the `-NoProfile` flag:
     ```
     "terminal.integrated.profiles.windows": {
       "PowerShell (No Profile)": {
         "source": "PowerShell",
         "icon": "terminal-powershell",
         "path": "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
         "args": ["-NoProfile"]
       }
     }
     ```

6. **Check VSCode Extensions**
   - Some extensions might interfere with shell integration
   - Try disabling extensions related to the terminal or PowerShell

7. **Reinstall PowerShell**
   - If all else fails, try reinstalling PowerShell

## Workaround

Until the shell integration issue is resolved, you can use the following workaround:

1. **Manual Output Capture**
   - When running commands that produce important output, redirect the output to a file
   - Example: `node test-shell-integration.js > output.txt`
   - Then read the file to see the output: `type output.txt`

2. **Use External Terminal**
   - Run commands in an external terminal window
   - Copy and paste the output back to Cline when needed

## Additional Resources

- [VSCode Terminal Documentation](https://code.visualstudio.com/docs/terminal/basics)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [VSCode Shell Integration Documentation](https://code.visualstudio.com/docs/terminal/shell-integration)
