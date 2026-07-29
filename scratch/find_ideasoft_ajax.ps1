[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Search all script src in corek-otu-yagi
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$srcMatches = [regex]::Matches($req.Content, '<script[^>]+src="([^"]+)"')
Write-Host "JS files loaded:" $srcMatches.Count
foreach ($sm in $srcMatches) {
    Write-Host "Script src:" $sm.Groups[1].Value
}
