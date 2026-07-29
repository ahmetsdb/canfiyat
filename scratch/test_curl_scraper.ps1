$pUrl = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$html = curl.exe -s -L $pUrl
Write-Host "Curl HTML Length:" $html.Length

if ($html -match '<h1[^>]*>(.*?)</h1>') {
    Write-Host "Title:" ($matches[1] -replace '<[^>]+>', '').Trim()
}
if ($html -match '<div class="product-price-new"[^>]*>(.*?)</div>') {
    Write-Host "Price:" ($matches[1] -replace '<[^>]+>', '').Trim()
}

$variantMatches = [regex]::Matches($html, 'class="variant-text"[^>]*>(.*?)</span>')
$vList = @()
foreach ($vm in $variantMatches) {
    $vList += $vm.Groups[1].Value.Trim()
}
Write-Host "Variants:" ($vList -join ", ")
