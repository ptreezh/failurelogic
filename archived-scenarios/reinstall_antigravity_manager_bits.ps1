# PowerShell script to download and reinstall Antigravity-Manager on Windows using BITS transfer

# Define variables
$version = "4.0.7"
$installerUrl = "https://github.com/lbjlaq/Antigravity-Manager/releases/download/v$version/Antigravity.Tools_$($version)_x64-setup.exe"
$installerPath = "$env:USERPROFILE\Downloads\Antigravity.Tools_$($version)_x64-setup.exe"

Write-Host "Attempting to download Antigravity-Manager v$version using BITS..." -ForegroundColor Green

try {
    # Create downloads directory if it doesn't exist
    $downloadsDir = "$env:USERPROFILE\Downloads"
    if (!(Test-Path $downloadsDir)) {
        New-Item -ItemType Directory -Path $downloadsDir -Force
    }
    
    # Import the BitsTransfer module
    Import-Module BitsTransfer -ErrorAction SilentlyContinue
    
    Write-Host "Downloading from: $installerUrl" -ForegroundColor Yellow
    Write-Host "Destination: $installerPath" -ForegroundColor Yellow
    
    # Use Start-BitsTransfer for more reliable download
    Start-BitsTransfer -Source $installerUrl -Destination $installerPath -DisplayName "Antigravity-Manager Installer" -Priority High
    
    Write-Host "Download completed successfully: $installerPath" -ForegroundColor Green
    
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
    Write-Warning "BITS transfer failed, trying alternative method..."
    
    try {
        # Fallback to WebClient method
        Write-Host "Trying alternative download method using WebClient..." -ForegroundColor Yellow
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($installerUrl, $installerPath)
        
        Write-Host "Download completed using WebClient: $installerPath" -ForegroundColor Green
        
        # Execute the installer
        Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait # Silent install
        Write-Host "Reinstallation completed using WebClient method!" -ForegroundColor Green
        
    } catch {
        Write-Error "Failed to download or reinstall Antigravity-Manager: $_"
        Write-Host "Manual download required:" -ForegroundColor Red
        Write-Host "1. Visit: https://github.com/lbjlaq/Antigravity-Manager/releases/tag/v$version" -ForegroundColor Red
        Write-Host "2. Download 'Antigravity.Tools_$($version)_x64-setup.exe'" -ForegroundColor Red
        Write-Host "3. Run the installer manually" -ForegroundColor Red
    }
}

# Ask if user wants to clean up installer
Write-Host "`nDownload location: $installerPath" -ForegroundColor Cyan
$cleanup = Read-Host "Do you want to delete the installer file after verification? (y/n)"
if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
    Start-Sleep -Seconds 2  # Give user time to see the message
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    Write-Host "Installer file removed." -ForegroundColor Green
}