$files = @("js/productsData.js", "js/liveSiteData.js", "js/storage.js", "js/calculator.js", "js/app.js")

foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "File $f exists. Size:" (Get-Item $f).Length "bytes"
    } else {
        Write-Host "CRITICAL ERROR: File $f DOES NOT EXIST!"
    }
}
