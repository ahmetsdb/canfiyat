[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$base = "https://www.cansizzadeyag.com"
$categories = @(
    "/kategori/bitkisel-yaglar",
    "/kategori/ucucu-yaglar",
    "/kategori/sabit-yaglar",
    "/kategori/organik-urunler",
    "/kategori/pekmezler"
)

$productMap = @{}

foreach ($cat in $categories) {
    try {
        $url = $base + $cat
        $req = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $links = [regex]::Matches($req.Content, '<a[^>]+href="([^"]*\/urun\/[^"]*)"[^>]*>')
        foreach ($l in $links) {
            $pUrl = $l.Groups[1].Value
            if (-not $pUrl.StartsWith("http")) { $pUrl = $base + $pUrl }
            if (-not $productMap.ContainsKey($pUrl)) {
                $productMap[$pUrl] = $true
            }
        }
    } catch {}
}

Write-Host "Total Unique Product URLs Discovered:" $productMap.Count

$scrapedData = @()

foreach ($pUrl in $productMap.Keys) {
    try {
        $req = Invoke-WebRequest -Uri $pUrl -UserAgent "Mozilla/5.0"
        $html = $req.Content

        $title = ""
        if ($html -match '<h1[^>]*>(.*?)</h1>') {
            $title = $matches[1] -replace '<[^>]+>', ''
            $title = $title.Trim()
        }

        $price = ""
        if ($html -match '<div class="product-price-new"[^>]*>(.*?)</div>') {
            $price = $matches[1] -replace '<[^>]+>', ''
            $price = $price.Trim()
        }

        # Check variation buttons in page
        $variants = @()
        $vMatches = [regex]::Matches($html, 'class="variant-text"[^>]*>(.*?)</span>')
        foreach ($vm in $vMatches) {
            $variants += $vm.Groups[1].Value.Trim()
        }

        $scrapedData += [PSCustomObject]@{
            Url = $pUrl
            Title = $title
            Price = $price
            Variants = ($variants -join ", ")
        }
    } catch {
        Write-Host "Failed to scrape:" $pUrl
    }
}

Write-Host "Scraped Total Items:" $scrapedData.Count
$scrapedData | Format-Table -AutoSize | Out-String -Width 300 | Write-Host
