# ==============================================================================
# MEDIQ OPD — INSTALL ALL MOBILE APPS TO PHONE (PRIBITE ARCHITECTURE)
# ==============================================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MEDIQ OPD - INSTALL ALL APPS TO PHONE   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$devices = adb devices | Select-String -Pattern "device$"
if (-not $devices) {
    Write-Host "❌ No Android device found. Please connect your phone via USB and enable USB Debugging." -ForegroundColor Red
    exit 1
}

$deviceId = ($devices[0].Line -split "\s+")[0]
Write-Host "Target Device: $deviceId" -ForegroundColor Green

$root = $PSScriptRoot
$opdDir = Join-Path $root "OPD"
if (-not (Test-Path $opdDir)) {
    $opdDir = $root
}

$apps = @(
    @{ Name = "MediQ Patient App"; Dir = (Join-Path $opdDir "patient_app"); Package = "com.citycare.opd.patient_app" },
    @{ Name = "MediQ Doctor App"; Dir = (Join-Path $opdDir "doctor_app"); Package = "com.citycare.opd.doctor_app" },
    @{ Name = "MediQ Pharmacy App"; Dir = (Join-Path $opdDir "pharmacy_app"); Package = "com.citycare.opd.pharmacy_app" },
    @{ Name = "MediQ Rider App"; Dir = (Join-Path $opdDir "rider_app"); Package = "com.citycare.opd.rider_app" }
)

foreach ($app in $apps) {
    Write-Host "`n📦 Checking $($app.Name)..." -ForegroundColor Yellow
    
    $releaseApk = Join-Path $app.Dir "build\app\outputs\flutter-apk\app-release.apk"
    $debugApk = Join-Path $app.Dir "build\app\outputs\flutter-apk\app-debug.apk"
    $apkToInstall = $null

    if (Test-Path $releaseApk) {
        $apkToInstall = $releaseApk
    } elseif (Test-Path $debugApk) {
        $apkToInstall = $debugApk
    } else {
        Write-Host "Building APK for $($app.Name)..." -ForegroundColor Cyan
        Push-Location $app.Dir
        flutter build apk --debug
        Pop-Location
        if (Test-Path $debugApk) {
            $apkToInstall = $debugApk
        }
    }

    if ($apkToInstall) {
        Write-Host "Installing $apkToInstall to $deviceId..." -ForegroundColor Cyan
        $installOutput = adb -s $deviceId install -r -d $apkToInstall 2>&1
        if ($LASTEXITCODE -ne 0 -and $installOutput -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE") {
            Write-Host "🔄 Signature mismatch detected. Reinstalling $($app.Package)..." -ForegroundColor Yellow
            adb -s $deviceId uninstall $app.Package
            adb -s $deviceId install -r $app.Path
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($app.Name) installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Failed to install $($app.Name): $installOutput" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Could not build or locate APK for $($app.Name)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All MediQ OPD apps installed to phone ($deviceId)!" -ForegroundColor Cyan
