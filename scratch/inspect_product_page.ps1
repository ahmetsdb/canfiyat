[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

Write-Host "Page Title:" ([regex]::Match($req.Content, '<title>(.*?)</title>').Groups[1].Value)

# Find variant select or variant data script
$scriptMatches = [regex]::Matches($req.Content, 'var variant\w*\s*=\s*(\{.*?\});', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Variant script matches:" $scriptMatches.Count

if ($scriptMatches.Count -gt 0) {
    Write-Host "Sample Script Match:" $scriptMatches[0].Value.Substring(0, [Math]::Min(300, $scriptMatches[0].Value.Length))
} else {
    # Look for select or options or prices in page HTML
    $priceMatches = [regex]::Matches($req.Content, 'class="[^"]*price[^"]*"[^>]*>(.*?)</div>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    Write-Host "Price matches:" $priceMatches.Count
    foreach ($pm in $priceMatches) {
        Write-Host "Price HTML:" $pm.Groups[1].Value.Trim()
    }
}

# Look for all select options or variant radio buttons in HTML
$optionMatches = [regex]::Matches($req.Content, '<option[^>]*>(.*?)</option>')
Write-Host "Option matches:" $optionMatches.Count
foreach ($opt in $optionMatches | Select-Object -First 20) {
    Write-Host "Option:" $opt.Groups[1].Value.Trim()
}
