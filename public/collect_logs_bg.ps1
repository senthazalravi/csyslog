# Citadel SysLog Background Service (JSON)
# Gathers tactical diagnostic data every 120 seconds.

$logDir = "C:\Users\ravia\Downloads\Citadel AI\powershell_logs"
if (!(Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory -Force }

while ($true) {
    try {
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $outputPath = Join-Path $logDir "Citadel_BG_Log_$($timestamp).json"
        
        # 1. Collect Data Parts
        $hardware = Get-PnpDevice | Where-Object { $_.Status -ne "OK" } | Select-Object FriendlyName, Status, Problem
        $network = Get-NetAdapter | Select-Object Name, Status, LinkSpeed
        $errors = Get-EventLog -LogName System -EntryType Error -Newest 10 | Select-Object TimeGenerated, Source, Message
        $usb = Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'USB' } | Select-Object FriendlyName, Status

        # 2. Build tactical JSON object
        $report = @{
            type        = "Tactical_OS_Report"
            timestamp   = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            systemInfo  = @{
                os       = (Get-WmiObject Win32_OperatingSystem).Caption
                hostname = $env:COMPUTERNAME
            }
            diagnostics = @{
                hardwareFailures = $hardware
                networkStatus    = $network
                systemErrors     = $errors
                usbDevices       = $usb
            }
        }

        # 3. Export to JSON
        $report | ConvertTo-Json -Depth 5 | Out-File $outputPath -Encoding utf8
        
        Write-Host "Tactical Log Generated: $outputPath" -ForegroundColor Cyan
    }
    catch {
        Write-Host "Error in background service: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds 120
}
