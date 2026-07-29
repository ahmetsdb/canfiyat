[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$res = curl.exe -s -i -L "https://canfiyat-two.vercel.app/js/app.js?v=1.53"
Write-Host "JS Header & Content Snippet:"
$res | Select-Object -First 30 | Write-Host

# Search for renderLayer3Cards in fetched app.js
$hasFn = ($res -join "`n") -like "*renderLayer3Cards*"
Write-Host "renderLayer3Cards function exists in live app.js?:" $hasFn
