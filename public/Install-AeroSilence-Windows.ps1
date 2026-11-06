<#
.SYNOPSIS
    AeroSilence ANC Workstation - Windows Desktop App Setup Script
.DESCRIPTION
    Creates a dedicated standalone desktop application shortcut with taskbar and start menu integration.
#>

$AppName = "AeroSilence ANC Workstation"
$AppUrl = "https://ais-pre-nwm2w2oo4dzl3bbd5hbkfn-267771827708.asia-east1.run.app"
$IconUrl = "$AppUrl/icon.svg"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "     AEROSILENCE ANC WORKSTATION - WINDOWS INSTALLER" -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

# Locate Chrome or Edge
$EdgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$ChromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
)

$TargetBrowser = $null
foreach ($path in $EdgePaths + $ChromePaths) {
    if (Test-Path $path) {
        $TargetBrowser = $path
        break
    }
}

if (-not $TargetBrowser) {
    Write-Warning "No standard Chrome or Edge installation detected. Launching in default browser..."
    Start-Process $AppUrl
    exit
}

Write-Host "[+] Using Host Engine: $TargetBrowser" -ForegroundColor Green

# Create Desktop Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "$AppName.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBrowser
$Shortcut.Arguments = "--app=$AppUrl --window-size=1380,880 --class=AeroSilenceANC --enable-features=WebRtcAudioProcessing"
$Shortcut.Description = "AeroSilence Real-Time Active Noise Cancellation DSP Workstation"
$Shortcut.Save()

Write-Host "[+] Desktop Shortcut Created: $ShortcutPath" -ForegroundColor Green

# Create Start Menu Shortcut
$StartMenuPath = [Environment]::GetFolderPath('Programs')
$StartShortcutPath = Join-Path $StartMenuPath "$AppName.lnk"
$StartShortcut = $WshShell.CreateShortcut($StartShortcutPath)
$StartShortcut.TargetPath = $TargetBrowser
$StartShortcut.Arguments = "--app=$AppUrl --window-size=1380,880 --class=AeroSilenceANC --enable-features=WebRtcAudioProcessing"
$StartShortcut.Description = "AeroSilence Real-Time Active Noise Cancellation DSP Workstation"
$StartShortcut.Save()

Write-Host "[+] Added to Windows Start Menu" -ForegroundColor Green
Write-Host "`n[*] Launching AeroSilence ANC Workstation in Standalone Mode..." -ForegroundColor Cyan

Start-Process $TargetBrowser -ArgumentList "--app=$AppUrl --window-size=1380,880 --class=AeroSilenceANC --enable-features=WebRtcAudioProcessing"
Start-Sleep -Seconds 2
