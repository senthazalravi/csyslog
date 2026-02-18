# Citadel SysLog Collector Script
# This script gathers system info, driver errors, and network status for AI analysis.

$logDir = "C:\Users\ravia\Downloads\Citadel AI\powershell_logs"
if (!(Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory -Force }
$outputPath = Join-Path $logDir "Citadel_System_Log_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$divider = "=========================================================="

Write-Host "Collecting tactical system logs... Please wait." -ForegroundColor Cyan

"Citadel SysLog Tactical Report" | Out-File $outputPath
$divider | Out-File $outputPath -Append

# 1. Hardware & Driver Failures
"--- HARDWARE & DRIVER STATUS ---" | Out-File $outputPath -Append
Get-PnpDevice | Where-Object { $_.Status -ne "OK" } | Select-Object FriendlyName, Status, Problem | Out-File $outputPath -Append
$divider | Out-File $outputPath -Append

# 2. Network Diagnostics
"--- NETWORK STATUS ---" | Out-File $outputPath -Append
Get-NetAdapter | Select-Object Name, Status, LinkSpeed | Out-File $outputPath -Append
Test-NetConnection -ComputerName 8.8.8.8 | Select-Object ComputerName, PingSucceeded | Out-File $outputPath -Append
$divider | Out-File $outputPath -Append

# 3. Recent Windows Error Events (Last 20)
"--- RECENT SYSTEM ERRORS ---" | Out-File $outputPath -Append
Get-EventLog -LogName System -EntryType Error -Newest 20 | Select-Object TimeGenerated, Source, Message | Out-File $outputPath -Append
$divider | Out-File $outputPath -Append

# 4. Connected USB Devices
"--- USB DEVICE LIST ---" | Out-File $outputPath -Append
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'USB' } | Select-Object FriendlyName, Status | Out-File $outputPath -Append

Write-Host "Success! Log saved to: $outputPath" -ForegroundColor Green
Write-Host "Upload this file to Citadel SysLog for AI Analysis." -ForegroundColor Yellow
