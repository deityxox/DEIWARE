# Yönetici yetkisi kontrolü
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]'Administrator')) {
    Write-Host "Bu işlem için yönetici yetkisi gereklidir." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

$path = "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity"
$name = "Enabled"

# Klasör yoksa oluştur (güvenlik nedeniyle nadiren gerekebilir)
if (!(Test-Path $path)) {
    New-Item -Path $path -Force | Out-Null
}

Clear-Host
Write-Host "--- HVCI (Memory Integrity) Kontrolü ---"
Write-Host "1. HVCI'yi AÇ (Enabled=1)"
Write-Host "2. HVCI'yi KAPAT (Enabled=0)"
$secim = Read-Host "Seçiminiz"

switch ($secim) {
    "1" {
        Set-ItemProperty -Path $path -Name $name -Value 1 -Type DWord
        Write-Host "HVCI aktif edildi. Değişikliğin uygulanması için bilgisayarı yeniden başlatın." -ForegroundColor Green
    }
    "2" {
        Set-ItemProperty -Path $path -Name $name -Value 0 -Type DWord
        Write-Host "HVCI devre dışı bırakıldı. Değişikliğin uygulanması için bilgisayarı yeniden başlatın." -ForegroundColor Red
    }
    Default {
        Write-Host "Geçersiz seçim!" -ForegroundColor Red
    }
}

Read-Host "`nÇıkmak için Enter tuşuna basın..."