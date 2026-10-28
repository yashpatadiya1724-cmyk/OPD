# ==============================================================================
# MediQ Mobile Apps Static Analysis & Verification Pipeline
# Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
# ==============================================================================

Write-Host "Starting MediQ 4-App Verification Suite..." -ForegroundColor Cyan

$apps = @("patient_app", "doctor_app", "pharmacy_app", "rider_app")
$failedCount = 0

foreach ($app in $apps) {
    $path = Join-Path $PSScriptRoot "..\$app"
    Write-Host "`n[+] Verifying $app..." -ForegroundColor Yellow
    Push-Location $path
    
    # Run flutter analyze
    flutter analyze
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[-] Issues detected in $app!" -ForegroundColor Red
        $failedCount++
    } else {
        Write-Host "[✓] $app passed with 0 issues!" -ForegroundColor Green
    }
    Pop-Location
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
if ($failedCount -eq 0) {
    Write-Host "[✓] All 4 MediQ mobile applications verified successfully!" -ForegroundColor Green
} else {
    Write-Host "[-] $failedCount app(s) failed verification. Check logs above." -ForegroundColor Red
}
Write-Host "=======================================================" -ForegroundColor Cyan
