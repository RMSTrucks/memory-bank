# PowerShell script to test shell integration

Write-Host "PowerShell Shell Integration Test"
Write-Host "==============================="
Write-Host ""
Write-Host "If you can see this output in the terminal, basic output is working."
Write-Host ""

# Test colored output
Write-Host "This text should be green." -ForegroundColor Green
Write-Host "This text should be red." -ForegroundColor Red
Write-Host "This text should be blue." -ForegroundColor Blue
Write-Host "This text should be yellow." -ForegroundColor Yellow
Write-Host ""

# Test progress indicator
Write-Host "Testing progress indicator:"
$progressChars = @('|', '/', '-', '\')
$i = 0

# Output a simple spinner animation
for ($j = 0; $j -lt 20; $j++) {
    Write-Host "`r$($progressChars[$i]) Processing..." -NoNewline
    $i = ($i + 1) % $progressChars.Length
    Start-Sleep -Milliseconds 100
}

Write-Host "`rDone!           "
Write-Host ""

Write-Host "If you can see all the above output with proper colors and animation,"
Write-Host "then shell integration is working correctly."
Write-Host ""
Write-Host "If you only see plain text or some elements are missing,"
Write-Host "there may still be issues with shell integration."
