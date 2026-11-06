@echo off
:: ============================================================================
:: AeroSilence ANC Workstation - Windows Desktop App Installer
:: Sets up a dedicated native standalone desktop application shortcut for Windows
:: ============================================================================
title AeroSilence ANC Installer
color 0B
echo.
echo ============================================================================
echo         AEROSILENCE ANC WORKSTATION - WINDOWS INSTALLER
echo      Real-Time Active Noise Cancellation & Acoustic DSP Workstation
echo ============================================================================
echo.

set APP_URL=https://ais-pre-nwm2w2oo4dzl3bbd5hbkfn-267771827708.asia-east1.run.app
set APP_NAME=AeroSilence ANC Workstation
set SHORTCUT_NAME=%USERPROFILE%\Desktop\%APP_NAME%.lnk

echo [*] Detecting Windows Chromium Browsers (Microsoft Edge / Google Chrome)...

set BROWSER_EXE=
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe
    echo [+] Detected Microsoft Edge (64-bit)
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe
    echo [+] Detected Microsoft Edge
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe
    echo [+] Detected Google Chrome (64-bit)
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
    echo [+] Detected Google Chrome
) else (
    echo [!] No standard Chrome or Edge installation found. Defaulting to system browser.
    start "" "%APP_URL%"
    goto :done
)

echo [*] Creating Desktop Application Shortcut: "%SHORTCUT_NAME%"...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_NAME%'); $Shortcut.TargetPath = '%BROWSER_EXE%'; $Shortcut.Arguments = '--app=%APP_URL% --window-size=1380,880 --class=AeroSilenceANC --enable-features=WebRtcAudioProcessing'; $Shortcut.Description = 'AeroSilence Real-Time Active Noise Cancellation DSP'; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [+] Desktop Shortcut successfully created!
    echo [+] Start Menu Integration:
    set START_MENU_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%.lnk
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_SHORTCUT%'); $Shortcut.TargetPath = '%BROWSER_EXE%'; $Shortcut.Arguments = '--app=%APP_URL% --window-size=1380,880 --class=AeroSilenceANC'; $Shortcut.Save()"
    echo [+] Added to Windows Start Menu!
) else (
    echo [!] Failed to create desktop shortcut.
)

echo.
echo ============================================================================
echo [*] Installation Complete! Launching AeroSilence ANC Workstation...
echo ============================================================================
start "" "%BROWSER_EXE%" --app=%APP_URL% --window-size=1380,880 --class=AeroSilenceANC --enable-features=WebRtcAudioProcessing

:done
timeout /t 4 >nul
exit
