@echo off
title Open Smart City Android App in Android Studio
echo ========================================================
echo        OPENING ANDROID PROJECT IN ANDROID STUDIO
echo ========================================================
echo.
if "%JAVA_HOME:~-4%"=="\bin" (
    set "JAVA_HOME=%JAVA_HOME:~0,-4%"
)
cd /d "%~dp0\client"
call npx cap open android
pause
