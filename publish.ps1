param (
    [string]$Msg = "Kompakt guncelemeler ve oturum kaydi",
    [string]$Version = ""
)

$gitExe = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

# Git kullanici kimligi
& $gitExe config user.name "Ahmet"
& $gitExe config user.email "ahmet@canfiyat.com"

$readmePath = Join-Path $PSScriptRoot "README.md"
$indexPath = Join-Path $PSScriptRoot "index.html"

# Mevcut versiyonu README.md uzerinden oku
$readmeContent = Get-Content $readmePath -Raw -Encoding UTF8

if ([string]::IsNullOrWhiteSpace($Version)) {
    if ($readmeContent -match 'Aktif S[üu]r[üu]m:\s*`v1\.(\d+)') {
        $nextMinor = [int]$matches[1] + 1
        $Version = "v1.$nextMinor"
    } else {
        $Version = "v1.15"
    }
} else {
    if (-not $Version.StartsWith("v")) {
        $Version = "v$Version"
    }
}

Write-Host "🚀 Otomatik Versiyon Bumping & Push Baslatiliyor..." -ForegroundColor Cyan
Write-Host "📌 Yeni Versiyon: $Version" -ForegroundColor Yellow
Write-Host "💬 Commit Mesaji: $Msg" -ForegroundColor Yellow

# index.html versiyon rozetini guncelle
if (Test-Path $indexPath) {
    $indexContent = Get-Content $indexPath -Raw -Encoding UTF8
    $indexContent = $indexContent -replace 'v1\.\d+[^<]*', $Version
    Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
    Write-Host "✔ index.html versiyon rozeti $Version olarak guncellendi." -ForegroundColor Green
}

# README.md versiyonunu ve tarihini guncelle
$dateStr = Get-Date -Format "dd MMMM yyyy HH:mm"
$readmeContent = $readmeContent -replace 'Aktif Sürüm:\s*`v1\.\d+[^`]*`', "Aktif Sürüm: `$Version`"
$readmeContent = $readmeContent -replace 'Son Güncelleme:\s*[^)]+', "Son Güncelleme: $dateStr"
Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
Write-Host "✔ README.md oturum ve versiyon bilgileri guncellendi." -ForegroundColor Green

# Git Islemleri (Add, Commit, Push)
$commitMsg = "${Version}: ${Msg}"
& $gitExe add .
& $gitExe commit -m $commitMsg
& $gitExe push origin main

Write-Host "🎉 Basariyla commit edildi ve GitHub'a push'landi ($Version)!" -ForegroundColor Green
