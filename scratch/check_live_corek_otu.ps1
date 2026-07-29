[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$urls = @(
    "https://www.cansizzadeyag.com/urun/corek-otu-yagi",
    "https://www.cansizzadeyag.com/urun/corek-otu-yagi-toptan",
    "https://www.cansizzadeyag.com/urun/corek-otu-yagi-kg-1-kg",
    "https://www.cansizzadeyag.com/urun/corek-otu-yagi-1-kg"
)

foreach ($u in $urls) {
    try {
        $html = curl.exe -s -L $u
        Write-Host "=== PAGE:" $u "==="
        
        $pMatches = [regex]::Matches($html, 'product-price-new[^>]*>\s*([\d\.,]+)\s*TL')
        foreach ($pm in $pMatches) {
            Write-Host " -> Price Found:" $pm.Groups[1].Value "TL"
        }

        $vMatches = [regex]::Matches($html, 'variant-text[^>]*>\s*([^<]+)\s*<')
        foreach ($vm in $vMatches) {
            Write-Host " -> Variant Found:" $vm.Groups[1].Value.Trim()
        }

        # Look for option prices or JSON variants
        $jsonMatches = [regex]::Matches($html, 'variant[^:]*:\s*\{[^}]+\}')
        foreach ($jm in $jsonMatches) {
            Write-Host " -> Variant JSON:" $jm.Value
        }
    } catch {
        Write-Host "Error fetching:" $u
    }
}
