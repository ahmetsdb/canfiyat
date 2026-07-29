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

$scrapedList = @()
$count = 0

foreach ($pPath in $productUrls.Keys) {
    $count++
    $pUrl = $base + $pPath
    try {
        Start-Sleep -Milliseconds 150
        $req = Invoke-WebRequest -Uri $pUrl -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $html = $req.Content

        $title = ""
        if ($html -match '<h1[^>]*>(.*?)</h1>') {
            $title = ($matches[1] -replace '<[^>]+>', '').Trim()
        }

        $priceStr = ""
        if ($html -match '<div class="product-price-new"[^>]*>(.*?)</div>') {
            $priceStr = ($matches[1] -replace '<[^>]+>', '').Trim()
        }

        $numericPrice = 0
        if ($priceStr -match '([\d\.,]+)') {
            $cleanVal = $matches[1] -replace '\.', '' -replace ',', '.'
            $numericPrice = [double]$cleanVal
        }

        # Extract Variant options from HTML if any
        $variants = @()
        $vMatches = [regex]::Matches($html, 'class="variant-text"[^>]*>(.*?)</span>')
        foreach ($vm in $vMatches) {
            $vText = $vm.Groups[1].Value.Trim()
            if ($vText -and $variants -notcontains $vText) {
                $variants += $vText
            }
        }

        $scrapedList += @{
            path = $pPath
            url = $pUrl
            title = $title
            priceStr = $priceStr
            price = $numericPrice
            variants = $variants
        }
        Write-Host "[$count/$($productUrls.Count)] Scraped: $title -> $priceStr (Variants: $($variants -join ', '))"
    } catch {
        Write-Host "[$count/$($productUrls.Count)] Error scraping $pUrl"
    }
}

Write-Host "Total Scraped Items:" $scrapedList.Count

$jsonContent = $scrapedList | ConvertTo-Json -Depth 5
$jsFileContent = "const LIVE_SITE_SCRAPED_DATA = $jsonContent;`n"
Set-Content -Path "c:\Users\ahmet\OneDrive\Belgeler\canfiyat\js\liveSiteData.js" -Value $jsFileContent -Encoding UTF8
Write-Host "Saved to js/liveSiteData.js successfully!"
