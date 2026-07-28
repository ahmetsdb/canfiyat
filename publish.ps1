param (
    [string]$Msg = "Kompakt guncellemeler ve oturum kaydi",
    [string]$Version = ""
)

$gitExe = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

# Git identity
& $gitExe config user.name "Ahmet"
& $gitExe config user.email "ahmet@canfiyat.com"

$readmePath = Join-Path $PSScriptRoot "README.md"
$indexPath = Join-Path $PSScriptRoot "index.html"

# Read version from README.md
$readmeContent = Get-Content $readmePath -Raw -Encoding UTF8

if ([string]::IsNullOrWhiteSpace($Version)) {
    if ($readmeContent -match '\(v1\.(\d+)\)') {
        $nextMinor = [int]$matches[1] + 1
        $Version = "v1.$nextMinor"
    } else {
        $Version = "v1.18"
    }
} else {
    if (-not $Version.StartsWith("v")) {
        $Version = "v$Version"
    }
}

Write-Host "Otomatik Versiyon ve Push Baslatiliyor..." -ForegroundColor Cyan
Write-Host "Yeni Versiyon: $Version" -ForegroundColor Yellow
Write-Host "Commit Mesaji: $Msg" -ForegroundColor Yellow

# Update index.html version badge & script cache busting tags
if (Test-Path $indexPath) {
    $indexContent = Get-Content $indexPath -Raw -Encoding UTF8
    $indexContent = $indexContent -replace 'v1\.\d+[^<]*', $Version
    $indexContent = $indexContent -replace '\?v=1\.\d+', "?v=$Version"
    Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
    Write-Host "index.html versiyon rozeti ve script cache-busting etiketleri guncellendi." -ForegroundColor Green
}

# Update README.md title version safely
$readmeContent = $readmeContent -replace '\(v1\.\d+[^\)]*\)', "($Version)"
Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
Write-Host "README.md versiyon bilgisi guncellendi." -ForegroundColor Green

# Git Add, Commit & Push
$commitTitle = "$Version : $Msg"
& $gitExe add .
& $gitExe commit -m "$commitTitle"
& $gitExe push origin main

Write-Host "Basariyla commit edildi ve GitHub push yapildi!" -ForegroundColor Green
