# PowerShell script to set up a "No Profile" terminal profile in VSCode settings

# Define the path to the VSCode settings.json file
$settingsPath = "$env:APPDATA\Code\User\settings.json"

# Read the current settings
$settings = Get-Content -Path $settingsPath -Raw | ConvertFrom-Json

# Check if terminal.integrated.profiles.windows exists
if (-not $settings.PSObject.Properties['terminal.integrated.profiles.windows']) {
    # Create the property if it doesn't exist
    $settings | Add-Member -Type NoteProperty -Name 'terminal.integrated.profiles.windows' -Value ([PSCustomObject]@{})
}

# Add the PowerShell (No Profile) profile
$settings.'terminal.integrated.profiles.windows' | Add-Member -Type NoteProperty -Name 'PowerShell (No Profile)' -Value ([PSCustomObject]@{
    source = "PowerShell"
    icon = "terminal-powershell"
    path = "C:\Program Files\PowerShell\7\pwsh.exe"
    args = @("-NoProfile")
}) -Force

# Set the new profile as the default
$settings.'terminal.integrated.defaultProfile.windows' = 'PowerShell (No Profile)'

# Ensure shell integration is enabled
$settings.'terminal.integrated.shellIntegration.enabled' = $true

# Save the updated settings
$settings | ConvertTo-Json -Depth 10 | Set-Content -Path $settingsPath

Write-Host "VSCode settings updated with 'PowerShell (No Profile)' terminal profile."
Write-Host "Please restart VSCode for the changes to take effect."
Write-Host ""
Write-Host "After restarting, you can test shell integration with the following command:"
Write-Host "node test-shell-integration.js"
