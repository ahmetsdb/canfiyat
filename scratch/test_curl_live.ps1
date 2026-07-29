[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$html = curl.exe -s -L "https://canfiyat-two.vercel.app/"

Write-Host "=== CANFIYAT VERCEL LIVE CURL REPORT ==="
Write-Host "HTML Total Length:" $html.Length "bytes"

$verMatch = [regex]::Match($html, 'v1\.\d+[^<]*')
Write-Host "Live Version Badge:" $verMatch.Value

$scriptMatches = [regex]::Matches($html, '<script[^>]+src="([^"]+)"')
Write-Host "Live Script Files Loaded:"
foreach ($sm in $scriptMatches) {
    Write-Host " -> " $sm.Groups[1].Value
}

$l3Match = [regex]::Match($html, 'id="layer3-product-grid"[^>]*>')
Write-Host "Layer 3 Grid Container Found:" $l3Match.Success
