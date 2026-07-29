[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$xmlPath = "C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml"
[xml]$xml = Get-Content $xmlPath -Encoding UTF8

$items = $xml.rss.channel.item
Write-Host "Total XML items parsed:" $items.Count

# Map product names to samplePrices per volume
# { "hardal tohumu yağı": { "1000ml": 750, "url": "..." } }
$productMap = @{}

foreach ($item in $items) {
    $title = ""
    if ($item.title -is [System.Xml.XmlElement]) {
        $title = $item.title.InnerText.Trim()
    } elseif ($item.title -is [string]) {
        $title = $item.title.Trim()
    }

    $link = ""
    if ($item.link -is [System.Xml.XmlElement]) {
        $link = $item.link.InnerText.Trim()
    } elseif ($item.link -is [string]) {
        $link = $item.link.Trim()
    }

    $priceRaw = ""
    if ($item.price) {
        if ($item.price -is [System.Xml.XmlElement]) {
            $priceRaw = $item.price.InnerText.Trim()
        } elseif ($item.price -is [string]) {
            $priceRaw = $item.price.Trim()
        }
    }

    $priceVal = 0
    if ($priceRaw) {
        $cleanStr = $priceRaw.Replace("TRY","").Replace("TL","").Trim()
        [double]::TryParse($cleanStr, [ref]$priceVal) | Out-Null
    }

    # Clean base product title (remove volume strings)
    $cleanTitle = $title -replace '(?i)\s*(1000|500|250|100|50|30|20)\s*(ml|gr|kg|g)\b', ''
    $cleanTitle = $cleanTitle -replace '(?i)\s*1\s*kg\b', ''
    $cleanTitle = $cleanTitle.Trim()

    # Detect volume
    $volKey = "250ml"
    if ($title -match '(?i)1000\s*ml|1000\s*gr|1\s*kg|1\s*l') { $volKey = "1000ml" }
    elseif ($title -match '(?i)500\s*ml|500\s*gr') { $volKey = "500ml" }
    elseif ($title -match '(?i)250\s*ml|250\s*gr') { $volKey = "250ml" }
    elseif ($title -match '(?i)100\s*ml') { $volKey = "100ml" }
    elseif ($title -match '(?i)50\s*ml') { $volKey = "50ml" }
    elseif ($title -match '(?i)30\s*ml') { $volKey = "30ml" }
    elseif ($title -match '(?i)20\s*ml') { $volKey = "20ml" }

    if (-not $productMap.ContainsKey($cleanTitle)) {
        $productMap[$cleanTitle] = @{
            name = $cleanTitle
            title = $cleanTitle
            url = $link
            samplePrices = @{}
        }
    }

    if ($priceVal -gt 0) {
        $productMap[$cleanTitle].samplePrices[$volKey] = $priceVal
    }
}

Write-Host "Grouped unique products count:" $productMap.Count

# Format as JavaScript array for liveSiteData.js
$jsLines = @()
$jsLines += "// Official Live Site Scraped Data generated from C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml"
$jsLines += "const LIVE_SITE_SCRAPED_DATA = ["

$keys = $productMap.Keys | Sort-Object
$index = 0
foreach ($k in $keys) {
    $p = $productMap[$k]
    $nameEsc = $p.name.Replace('"', '\"')
    $urlEsc = $p.url.Replace('"', '\"')

    $priceObjParts = @()
    foreach ($vk in $p.samplePrices.Keys) {
        $pv = $p.samplePrices[$vk]
        $priceObjParts += "`"$vk`": $pv"
    }
    $priceObjStr = "{" + ($priceObjParts -join ", ") + "}"

    $comma = if ($index -lt ($keys.Count - 1)) { "," } else { "" }
    $jsLines += "  { id: `"xml_$index`", title: `"$nameEsc`", name: `"$nameEsc`", url: `"$urlEsc`", samplePrices: $priceObjStr }$comma"
    $index++
}

$jsLines += "];"

$jsContent = $jsLines -join "`n"
Set-Content -Path "js/liveSiteData.js" -Value $jsContent -Encoding UTF8
Write-Host "Successfully wrote updated js/liveSiteData.js! File size:" (Get-Item "js/liveSiteData.js").Length "bytes"
