[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)
$jsText  = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)

# Parse XML items using Regex
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

Write-Host "Total XML items parsed cleanly:" $xmlItems.Count

# Parse 65 initial products
$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

Write-Host "INITIAL_PRODUCTS count:" $pMatches.Count

function Normalize-Str($str) {
    $s = $str.ToLower()
    $s = $s.Replace("ğ","g").Replace("ü","u").Replace("ş","s").Replace("ı","i").Replace("ö","o").Replace("ç","c")
    $s = $s -replace 'yağı|yagi|yag|uçucu|ucucu|yağlar|yaglar|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk|sıkım|soguk|sikim|meyveli|süzülmüş|suzulmus', ''
    return ($s -replace '[^\w]', '').Trim()
}

$matchedCount = 0
$notFoundCount = 0

foreach ($pm in $pMatches) {
    $sku = $pm.Groups[2].Value
    $name = $pm.Groups[3].Value
    $pNorm = Normalize-Str $name

    $vols = @{}
    foreach ($xi in $xmlItems) {
        $xNorm = Normalize-Str $xi.Title
        if ($xNorm.Contains($pNorm) -or $pNorm.Contains($xNorm)) {
            $vol = "250ml"
            if ($xi.Title -match '(?i)1000\s*ml|1000\s*gr|1\s*kg|1\s*l') { $vol = "1000ml" }
            elseif ($xi.Title -match '(?i)500\s*ml|500\s*gr') { $vol = "500ml" }
            elseif ($xi.Title -match '(?i)250\s*ml|250\s*gr') { $vol = "250ml" }
            elseif ($xi.Title -match '(?i)100\s*ml') { $vol = "100ml" }
            elseif ($xi.Title -match '(?i)50\s*ml') { $vol = "50ml" }
            elseif ($xi.Title -match '(?i)30\s*ml') { $vol = "30ml" }
            elseif ($xi.Title -match '(?i)20\s*ml') { $vol = "20ml" }

            $vols[$vol] = $xi.Price
        }
    }

    if ($vols.Count -gt 0) {
        $matchedCount++
        $volList = ($vols.Keys | Sort-Object) -join ", "
        Write-Host "[FOUND SITE ITEM] $sku - $name -> Volumes: $volList"
    } else {
        $notFoundCount++
        Write-Host "[NOT ON SITE -> N/A] $sku - $name"
    }
}

Write-Host "`n=== SUMMARY ==="
Write-Host "Found on site:" $matchedCount
Write-Host "NOT on site (N/A):" $notFoundCount
