[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$xmlPath = "C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml"
[xml]$xml = Get-Content $xmlPath -Encoding UTF8
$items = $xml.rss.channel.item

# Read 65 initial products from productsData.js
$pContent = Get-Content "js/productsData.js" -Raw
$pMatches = [regex]::Matches($pContent, '\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)')

Write-Host "INITIAL_PRODUCTS count:" $pMatches.Count

$report = @()

foreach ($pm in $pMatches) {
    $sku = $pm.Groups[2].Value
    $name = $pm.Groups[3].Value
    $category = $pm.Groups[4].Value
    $costPerKg = [double]$pm.Groups[6].Value

    # Normalize name for string matching
    # Remove "yağı", "uçucu", "yağ", etc.
    $normName = $name.ToLower()
    $normName = $normName -replace 'yağı|yağ|uçucu|yağlar|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk sıkım|meyveli|süzülmüş', ''
    $normName = ($normName -replace '[^\w]', '').Trim()

    $matchingItems = @()
    foreach ($item in $items) {
        $itemTitle = if ($item.title -is [System.Xml.XmlElement]) { $item.title.InnerText } else { $item.title }
        $itemPrice = if ($item.price -is [System.Xml.XmlElement]) { $item.price.InnerText } else { $item.price }
        $itemLink  = if ($item.link  -is [System.Xml.XmlElement]) { $item.link.InnerText }  else { $item.link }

        $normItemTitle = $itemTitle.ToLower()
        $normItemTitle = $normItemTitle -replace 'yağı|yağ|uçucu|yağlar|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk sıkım|meyveli|süzülmüş', ''
        $normItemTitle = ($normItemTitle -replace '[^\w]', '').Trim()

        if ($normItemTitle.Contains($normName) -or $normName.Contains($normItemTitle)) {
            $priceVal = 0
            if ($itemPrice) {
                $cleanP = $itemPrice.Replace("TRY","").Replace("TL","").Trim()
                [double]::TryParse($cleanP, [ref]$priceVal) | Out-Null
            }

            # Detect volume size
            $vol = "250ml"
            if ($itemTitle -match '(?i)1000\s*ml|1000\s*gr|1\s*kg|1\s*l') { $vol = "1000ml" }
            elseif ($itemTitle -match '(?i)500\s*ml|500\s*gr') { $vol = "500ml" }
            elseif ($itemTitle -match '(?i)250\s*ml|250\s*gr') { $vol = "250ml" }
            elseif ($itemTitle -match '(?i)100\s*ml') { $vol = "100ml" }
            elseif ($itemTitle -match '(?i)50\s*ml') { $vol = "50ml" }
            elseif ($itemTitle -match '(?i)30\s*ml') { $vol = "30ml" }
            elseif ($itemTitle -match '(?i)20\s*ml') { $vol = "20ml" }

            $matchingItems += [PSCustomObject]@{
                Title = $itemTitle
                Volume = $vol
                Price = $priceVal
                Link = $itemLink
            }
        }
    }

    $volsFound = ($matchingItems | Select-Object -ExpandProperty Volume -Unique) -join ", "
    $isFound = $matchingItems.Count -gt 0

    $report += [PSCustomObject]@{
        SKU = $sku
        Name = $name
        FoundOnSite = $isFound
        VolumesOnSite = if ($isFound) { $volsFound } else { "N/A (Sitede Yok)" }
        ItemCount = $matchingItems.Count
    }
}

Write-Host "=== 65 PRODUCTS CANSIZZADEYAG.COM AVAILABILITY REPORT ==="
$report | Format-Table -AutoSize
