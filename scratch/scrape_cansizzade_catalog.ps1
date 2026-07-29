[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$base = "https://www.cansizzadeyag.com"
$catUrls = @(
    "/kategori/soguk-pres-yaglar",
    "/kategori/soguk-pres-yaglar?tp=2",
    "/kategori/soguk-pres-yaglar?tp=3",
    "/kategori/endora-dogal",
    "/kategori/endora-dogal?tp=2",
    "/kategori/cesitler"
)

$productUrls = @{}

foreach ($cat in $catUrls) {
    try {
        $url = $base + $cat
        $req = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $links = [regex]::Matches($req.Content, 'href="(\/urun\/[^"]+)"')
        foreach ($l in $links) {
            $p = $l.Groups[1].Value
            $productUrls[$p] = $true
        }
    } catch {}
}

Write-Host "Total Product Pages Found:" $productUrls.Count

$results = @()

foreach ($pPath in $productUrls.Keys) {
    $pUrl = $base + $pPath
    try {
        $req = Invoke-WebRequest -Uri $pUrl -UserAgent "Mozilla/5.0"
        $html = $req.Content

        $title = ""
        if ($html -match '<h1[^>]*>(.*?)</h1>') {
            $title = ($matches[1] -replace '<[^>]+>', '').Trim()
        }

        $price = ""
        if ($html -match '<div class="product-price-new"[^>]*>(.*?)</div>') {
            $price = ($matches[1] -replace '<[^>]+>', '').Trim()
        }

        # Variants
        $variants = @()
        $vMatches = [regex]::Matches($html, 'class="variant-text"[^>]*>(.*?)</span>')
        foreach ($vm in $vMatches) {
            $vText = $vm.Groups[1].Value.Trim()
            if ($vText -and $variants -notcontains $vText) {
                $variants += $vText
            }
        }

        $results += [PSCustomObject]@{
            Path = $pPath
            Title = $title
            Price = $price
            Variants = ($variants -join ", ")
        }
    } catch {}
}

Write-Host "Successfully Scraped Items:" $results.Count
$results | Sort-Object Title | Format-Table -AutoSize | Out-String -Width 300 | Write-Host
