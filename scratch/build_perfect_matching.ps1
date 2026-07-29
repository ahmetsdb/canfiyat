[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)
$jsText  = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)

# Extract XML items
$itemRegex = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$priceRegex = [regex]'<g:price>([\s\S]*?)<\/g:price>'
$linkRegex = [regex]'<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>'

$xmlItems = @()
$itemMatches = $itemRegex.Matches($xmlText)

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    $tMatch = $titleRegex.Match($block)
    $pMatch = $priceRegex.Match($block)
    $lMatch = $linkRegex.Match($block)

    $title = if ($tMatch.Groups[1].Success) { $tMatch.Groups[1].Value } else { $tMatch.Groups[2].Value }
    $price = if ($pMatch.Success) { $pMatch.Groups[1].Value.Replace("TRY","").Replace("TL","").Trim() } else { "0" }
    $link  = if ($lMatch.Groups[1].Success) { $lMatch.Groups[1].Value } else { $lMatch.Groups[2].Value }

    $priceVal = 0.0
    [double]::TryParse($price, [ref]$priceVal) | Out-Null

    if ($title) {
        $xmlItems += [PSCustomObject]@{
            Title = $title.Trim()
            Price = $priceVal
            Link = $link.Trim()
        }
    }
}

# Parse 65 initial products
$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

function Clean-Name($str) {
    $s = $str.ToLower().Trim()
    $s = $s.Replace("i̇","i").Replace("ı","i").Replace("ğ","g").Replace("ü","u").Replace("ş","s").Replace("ö","o").Replace("ç","c")
    $s = $s -replace '\(.*\)', ''
    $s = $s -replace 'uçucu|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk sıkım|meyveli|süzülmüş|ruşeym|kalendula', ''
    $s = $s -replace '[^\w\s]', ''
    return ($s -replace '\s+', ' ').Trim()
}

$siteDataObj = @{}

foreach ($pm in $pMatches) {
    $id = $pm.Groups[1].Value
    $sku = $pm.Groups[2].Value
    $name = $pm.Groups[3].Value
    $cat = $pm.Groups[4].Value
    $cost = [double]$pm.Groups[6].Value

    $cleanPName = Clean-Name $name

    $vols = @{}
    $matchLink = ""
    $matchTitle = ""

    foreach ($xi in $xmlItems) {
        $cleanXTitle = Clean-Name $xi.Title
        
        # Core word match (e.g. "yasemin", "bergamot", "biberiye", "hodan", "çörek otu")
        $pWords = $cleanPName.Split(' ') | Where-Object { $_.Length -gt 2 -and $_ -ne "yagi" -and $_ -ne "yag" -and $_ -ne "tohumu" -and $_ -ne "cekirdegi" }

        $allMatch = $true
        foreach ($w in $pWords) {
            if (-not $cleanXTitle.Contains($w)) {
                $allMatch = $false
                break
            }
        }

        if ($allMatch -and $pWords.Count -gt 0) {
            $vol = "250ml"
            if ($xi.Title -match '(?i)1000\s*ml|1000\s*gr|1\s*kg|1\s*l') { $vol = "1000ml" }
            elseif ($xi.Title -match '(?i)500\s*ml|500\s*gr') { $vol = "500ml" }
            elseif ($xi.Title -match '(?i)250\s*ml|250\s*gr') { $vol = "250ml" }
            elseif ($xi.Title -match '(?i)100\s*ml') { $vol = "100ml" }
            elseif ($xi.Title -match '(?i)50\s*ml') { $vol = "50ml" }
            elseif ($xi.Title -match '(?i)30\s*ml') { $vol = "30ml" }
            elseif ($xi.Title -match '(?i)20\s*ml') { $vol = "20ml" }

            $vols[$vol] = $xi.Price
            if (-not $matchLink) { $matchLink = $xi.Link }
            if (-not $matchTitle) { $matchTitle = $xi.Title }
        }
    }

    $siteDataObj[$id] = @{
        id = $id
        sku = $sku
        name = $name
        category = $cat
        costPerKg = $cost
        matchTitle = $matchTitle
        url = $matchLink
        samplePrices = $vols
        hasSitePrice = ($vols.Count -gt 0)
    }

    if ($vols.Count -gt 0) {
        $vStr = ($vols.Keys | Sort-Object) -join ", "
        Write-Host "✅ [SİTEDE VAR] $sku - $name -> Ambalajlar: $vStr"
    } else {
        Write-Host "❌ [SİTEDE YOK -> N/A] $sku - $name"
    }
}

# Now let's serialize $siteDataObj to JS format for liveSiteData.js
$jsLines = @()
$jsLines += "// Official Precise Matching Live Site Data generated from GOOGLE-MERCHANT.xml"
$jsLines += "const LIVE_SITE_SCRAPED_DATA = {"

$keys = $siteDataObj.Keys | Sort-Object
$idx = 0
foreach ($k in $keys) {
    $item = $siteDataObj[$k]
    $idStr = $item.id
    $skuStr = $item.sku
    $nameStr = $item.name.Replace('"', '\"')
    $urlStr = if ($item.url) { $item.url.Replace('"', '\"') } else { "https://www.cansizzadeyag.com/" }

    $pParts = @()
    foreach ($vk in $item.samplePrices.Keys) {
        $pv = $item.samplePrices[$vk]
        $pParts += "`"$vk`": $pv"
    }
    $pObjStr = "{" + ($pParts -join ", ") + "}"
    $hasPriceBool = if ($item.hasSitePrice) { "true" } else { "false" }

    $comma = if ($idx -lt ($keys.Count - 1)) { "," } else { "" }
    $jsLines += "  `"$idStr`": { id: `"$idStr`", sku: `"$skuStr`", name: `"$nameStr`", url: `"$urlStr`", samplePrices: $pObjStr, hasSitePrice: $hasPriceBool }$comma"
    $idx++
}

$jsLines += "};"

Set-Content -Path "js/liveSiteData.js" -Value ($jsLines -join "`n") -Encoding UTF8
Write-Host "`nWrote updated js/liveSiteData.js! Size:" (Get-Item "js/liveSiteData.js").Length "bytes"
