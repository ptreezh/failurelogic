# PowerShell script to download and install Antigravity-Manager on Windows

# Define variables
$version = "4.0.7"
$installerUrl = "https://github.com/lbjlaq/Antigravity-Manager/releases/download/v$version/Antigravity.Tools_$($version)_x64-setup.exe"
$installerPath = "$env:TEMP\Antigravity.Tools_$($version)_x64-setup.exe"

Write-Host "Downloading Antigravity-Manager v$version..." -ForegroundColor Green

try {
    # Download the installer
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    
    Write-Host "Download completed: $installerPath" -ForegroundColor Green
    
    Write-Host "Starting installation..." -ForegroundColor Yellow
    Write-Host "Note: You may see security prompts. Please allow the installation to proceed." -ForegroundColor Yellow
    
    # Execute the installer
    Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait # Silent install, remove /S for interactive
    
    Write-Host "Installation completed!" -ForegroundColor Green
    Write-Host "You can now launch Antigravity-Manager from the Start menu or desktop shortcut." -ForegroundColor Cyan
    
} catch {
    Write-Error "Failed to download or install Antigravity-Manager: $_"
    Write-Host "Please visit https://github.com/lbjlaq/Antigravity-Manager/releases to download manually" -ForegroundColor Red
}

# Clean up - remove installer after installation
Start-Sleep 5
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue