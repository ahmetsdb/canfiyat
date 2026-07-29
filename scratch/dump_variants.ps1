[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# Look for sub-products, variant boxes, or JSON variables in page HTML
$matches = [regex]::Matches($req.Content, 'data-variant[^>]*>')
Write-Host "Data variant matches:" $matches.Count

# Search for any JSON script blocks in head or body
$jsonScripts = [regex]::Matches($req.Content, '<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "LD+JSON scripts:" $jsonScripts.Count
foreach ($js in $jsonScripts) {
    Write-Host "JSON:" $js.Groups[1].Value.Substring(0, [Math]::Min(300, $js.Groups[1].Value.Length))
}

# Look for subproduct variants in HTML
$submatches = [regex]::Matches($req.Content, '<div[^>]+class="[^"]*subproduct[^"]*"[^>]*>(.*?)</div>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Subproduct matches:" $submatches.Count
