# PowerShell script to download and reinstall Antigravity-Manager on Windows

# Define variables
$version = "4.0.7"
$installerUrl = "https://github.com/lbjlaq/Antigravity-Manager/releases/download/v$version/Antigravity.Tools_$($version)_x64-setup.exe"
$installerPath = "$env:USERPROFILE\Downloads\Antigravity.Tools_$($version)_x64-setup.exe"

Write-Host "Downloading Antigravity-Manager v$version to Downloads folder..." -ForegroundColor Green

try {
    # Create downloads directory if it doesn't exist
    $downloadsDir = "$env:USERPROFILE\Downloads"
    if (!(Test-Path $downloadsDir)) {
        New-Item -ItemType Directory -Path $downloadsDir -Force
    }
    
    # Download the installer to Downloads folder
    Write-Host "Downloading from: $installerUrl" -ForegroundColor Yellow
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    
    Write-Host "Download completed: $installerPath" -ForegroundColor Green
    
    Write-Host "Stopping any existing Antigravity processes..." -ForegroundColor Yellow
    Get-Process -Name "Antigravity*" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Start-Sleep -Seconds 3
    
    Write-Host "Starting installation..." -ForegroundColor Yellow
    Write-Host "Note: You may see security prompts. Please allow the installation to proceed." -ForegroundColor Yellow
    
    # Execute the installer with silent install flag
    Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait # Silent install
    
    Write-Host "Reinstallation completed!" -ForegroundColor Green
    Write-Host "Antigravity-Manager has been installed to the default location." -ForegroundColor Cyan
    
} catch {
    Write-Error "Failed to download or reinstall Antigravity-Manager: $_"
    Write-Host "Please visit https://github.com/lbjlaq/Antigravity-Manager/releases to download manually" -ForegroundColor Red
}

# Clean up - remove installer after installation if desired
$cleanup = Read-Host "Do you want to delete the installer file? (y/n)"
if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    Write-Host "Installer file removed." -ForegroundColor Green
}