@echo off
title Open Smart City Android App in Android Studio
echo ========================================================
echo        OPENING ANDROID PROJECT IN ANDROID STUDIO
echo ========================================================
echo.
set "STUDIO_EXE=C:\Program Files\Android\Android Studio\bin\studio64.exe"
set "ANDROID_DIR=%~dp0client\android"

if exist "%STUDIO_EXE%" (
    echo [OK] Launching Android Studio directly with client\android...
    start "" "%STUDIO_EXE%" "%ANDROID_DIR%"
) else (
    echo [INFO] Opening via Capacitor CLI...
    cd /d "%~dp0\client"
    call npx.cmd cap open android
)

echo.
echo ========================================================
echo  Android Studio opened!
echo  To run on emulator or USB phone:
echo  1. Let Gradle sync complete.
echo  2. Select your device / emulator from the top toolbar.
echo  3. Click the green 'Run' (Play) button.
echo ========================================================
timeout /t 5

