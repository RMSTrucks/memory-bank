# PowerShell script to run a command and capture its output to a file
# Usage: .\run-with-output.ps1 "command arguments"

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

# Create a timestamp for the output file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "command_output_$timestamp.txt"

Write-Host "Running command: $Command"
Write-Host "Output will be saved to: $outputFile"
Write-Host ""

# Run the command and redirect output to file
Invoke-Expression "$Command > $outputFile 2>&1"

# Check if the command executed successfully
if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
    Write-Host "Command executed successfully."
} else {
    Write-Host "Command failed with exit code: $LASTEXITCODE"
}

# Display the output
Write-Host ""
Write-Host "Command Output:"
Write-Host "==============="
Get-Content $outputFile | ForEach-Object {
    Write-Host $_
}

Write-Host ""
Write-Host "Output saved to: $outputFile"
