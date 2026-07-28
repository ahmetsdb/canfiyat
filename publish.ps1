param (
    [string]$Msg = "Anlik yenileme ve bilesen guncellemesi",
    [string]$Version = "",
    [string]$DeployHook = ""
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
$hookPath = Join-Path $PSScriptRoot "vercel_hook.txt"

# Read version from README.md
$readmeContent = Get-Content $readmePath -Raw -Encoding UTF8

if ([string]::IsNullOrWhiteSpace($Version)) {
    if ($readmeContent -match '\(v1\.(\d+)\)') {
        $nextMinor = [int]$matches[1] + 1
        $Version = "v1.$nextMinor"
    } else {
        $Version = "v1.20"
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
    $indexContent = $indexContent -replace '\?v=v?1\.\d+', "?v=$Version"
    Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
    Write-Host "index.html versiyon rozeti ve script cache-busting etiketleri guncellendi." -ForegroundColor Green
}

# Update README.md title version safely
$readmeContent = $readmeContent -replace '\(v1\.\d+[^\)]*\)', "($Version)"
Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
Write-Host "README.md versiyon bilgisi guncellendi." -ForegroundColor Green

# Git Add, Commit & Push (Both main and master branches)
$commitTitle = "$Version : $Msg"
& $gitExe add .
& $gitExe commit -m "$commitTitle"
& $gitExe push origin main
& $gitExe push origin main:master

# Vercel Deploy Hook (Anlik Otomatik Yayina Alma Webhook'u)
if ([string]::IsNullOrWhiteSpace($DeployHook) -and (Test-Path $hookPath)) {
    $DeployHook = (Get-Content $hookPath -Raw).Trim()
}

if (-not [string]::IsNullOrWhiteSpace($DeployHook)) {
    try {
        Write-Host "Vercel Deploy Hook tetikleniyor..." -ForegroundColor Cyan
        Invoke-RestMethod -Uri $DeployHook -Method Post
        Write-Host "Vercel anlik yayinlama tetiklendi!" -ForegroundColor Green
    } catch {
        Write-Host "Vercel Hook tetiklenirken hata: $_" -ForegroundColor Red
    }
}

Write-Host "Basariyla commit edildi ve GitHub main & master dallarina push yapildi!" -ForegroundColor Green
