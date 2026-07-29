[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$res = curl.exe -s -i -L "https://canfiyat-two.vercel.app/"
Write-Host "Total lines returned by curl:" $res.Count
$res | Select-Object -First 30 | Write-Host
