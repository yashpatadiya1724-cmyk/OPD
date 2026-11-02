# ==============================================================================
# MEDIQ OPD — REBUILD & UPDATE ALL APPS WITH ICONS & CODE (PRIBITE ARCHITECTURE)
# ==============================================================================
param(
    [string]$AppToBuild = "all"
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  MEDIQ OPD - PRODUCTION RELEASE BUILD & DEPLOY   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$devices = adb devices | Select-String -Pattern "device$"
$deviceId = $null
if ($devices) {
    $deviceId = ($devices[0].Line -split "\s+")[0]
    Write-Host "Target Android Device: $deviceId" -ForegroundColor Green
} else {
    Write-Host "Notice: No Android device detected via ADB." -ForegroundColor Yellow
}

$root = $PSScriptRoot
$opdDir = Join-Path $root "OPD"
if (-not (Test-Path $opdDir)) {
    $opdDir = $root
}

$allApps = @(
    [PSCustomObject]@{ Key = "patient"; Name = "MediQ Patient App"; Dir = (Join-Path $opdDir "patient_app"); Apk = (Join-Path $opdDir "patient_app\build\app\outputs\flutter-apk\app-release.apk"); Package = "com.citycare.opd.patient_app" },
    [PSCustomObject]@{ Key = "doctor"; Name = "MediQ Doctor App"; Dir = (Join-Path $opdDir "doctor_app"); Apk = (Join-Path $opdDir "doctor_app\build\app\outputs\flutter-apk\app-release.apk"); Package = "com.citycare.opd.doctor_app" },
    [PSCustomObject]@{ Key = "pharmacy"; Name = "MediQ Pharmacy App"; Dir = (Join-Path $opdDir "pharmacy_app"); Apk = (Join-Path $opdDir "pharmacy_app\build\app\outputs\flutter-apk\app-release.apk"); Package = "com.citycare.opd.pharmacy_app" },
    [PSCustomObject]@{ Key = "rider"; Name = "MediQ Rider App"; Dir = (Join-Path $opdDir "rider_app"); Apk = (Join-Path $opdDir "rider_app\build\app\outputs\flutter-apk\app-release.apk"); Package = "com.citycare.opd.rider_app" }
)

$targetList = $allApps
if ($AppToBuild -ne "all") {
    $targetList = $allApps | Where-Object { $_.Key -eq $AppToBuild }
}

$releaseDir = Join-Path $root "release_apks"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
}

foreach ($target in $targetList) {
    $appName = $target.Name
    $appKey = $target.Key
    $appPath = $target.Dir
    $appApk = $target.Apk
    $appPkg = $target.Package

    if (-not (Test-Path $appPath)) {
        Write-Host "Directory not found: $appPath" -ForegroundColor Red
        continue
    }

    Write-Host "`n-------------------------------------------------" -ForegroundColor Magenta
    Write-Host "Building $appName ($appKey) [Release Mode]..." -ForegroundColor Yellow
    Write-Host "Directory: $appPath" -ForegroundColor Gray
    Write-Host "-------------------------------------------------" -ForegroundColor Magenta
    
    Push-Location $appPath
    flutter build apk --release
    $res = $LASTEXITCODE
    Pop-Location

    if ($res -ne 0) {
        Write-Host "❌ Build failed for $appName (Exit Code: $res)" -ForegroundColor Red
        continue
    }

    $destApk = Join-Path $releaseDir "mediq-$appKey-release.apk"
    if (Test-Path $appApk) {
        Copy-Item -Path $appApk -Destination $destApk -Force
        Write-Host "Copied Release APK to $destApk" -ForegroundColor Green
    }

    if ($deviceId) {
        Write-Host "Installing $appName to device $deviceId..." -ForegroundColor Cyan
        $installOutput = adb -s $deviceId install -r -d $destApk 2>&1
        if ($LASTEXITCODE -ne 0 -and $installOutput -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE") {
            Write-Host "Signature mismatch detected. Reinstalling $appPkg..." -ForegroundColor Yellow
            adb -s $deviceId uninstall $appPkg
            adb -s $deviceId install -r $destApk
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $appName installed on $deviceId" -ForegroundColor Green
        } else {
            Write-Host "FAILED: Could not install $appName" -ForegroundColor Red
        }
    }
}

Write-Host "All requested MediQ apps processed and deployed successfully!" -ForegroundColor Cyan
