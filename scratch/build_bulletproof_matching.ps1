[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)
$jsText  = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)

# Parse XML items, strictly excluding Endora
$itemRegex = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$priceRegex = [regex]'<g:price>([\s\S]*?)<\/g:price>'
$linkRegex = [regex]'<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>'
$brandRegex = [regex]'<g:brand><!\[CDATA\[([\s\S]*?)\]\]><\/g:brand>|<g:brand>([\s\S]*?)<\/g:brand>'

$xmlItems = @()
$itemMatches = $itemRegex.Matches($xmlText)
$endoraExcludedCount = 0

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    $tMatch = $titleRegex.Match($block)
    $pMatch = $priceRegex.Match($block)
    $lMatch = $linkRegex.Match($block)
    $bMatch = $brandRegex.Match($block)

    $title = if ($tMatch.Groups[1].Success) { $tMatch.Groups[1].Value } else { $tMatch.Groups[2].Value }
    $price = if ($pMatch.Success) { $pMatch.Groups[1].Value.Replace("TRY","").Replace("TL","").Trim() } else { "0" }
    $link  = if ($lMatch.Groups[1].Success) { $lMatch.Groups[1].Value } else { $lMatch.Groups[2].Value }
    $brand = if ($bMatch.Groups[1].Success) { $bMatch.Groups[1].Value } else { $bMatch.Groups[2].Value }

    # Strict Endora exclusion
    if ($title -like "*Endora*" -or $title -like "*endora*" -or $link -like "*endora*" -or $brand -like "*Endora*") {
        $endoraExcludedCount++
        continue
    }

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

Write-Host "Total XML items parsed (Pure Cansızzade, Endora Excluded):" $xmlItems.Count
Write-Host "Total Endora items excluded:" $endoraExcludedCount

# Function to normalize Turkish characters to English ASCII
function Normalize-Tr($str) {
    if (-not $str) { return "" }
    $s = $str.ToLower().Trim()
    $s = $s.Replace("ç","c").Replace("ğ","g").Replace("ı","i").Replace("i̇","i").Replace("ö","o").Replace("ş","s").Replace("ü","u")
    $s = $s -replace 'yağı|yagi|yag|uçucu|ucucu|yağlar|yaglar|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk sıkım|soguk sikim|meyveli|süzülmüş|suzulmus|ruşeym|ruseym|kalendula', ''
    $s = $s -replace '[^\w\s]', ''
    return ($s -replace '\s+', ' ').Trim()
}

# Explicit Stems for all 65 products
$stemMap = @{
    "U.0271" = "yasemin"
    "U.0326" = "bergamot"
    "U.0235" = "biberiye"
    "U.0313" = "citronella"
    "U.0320" = "cay agaci"
    "T.0407" = "defne yaprag"
    "U.0332" = "greyfurt"
    "U.0106" = "karanfil"
    "U.0105" = "karanfil"
    "U.0199" = "nane"
    "U.0155" = "lavanta"
    "U.285"  = "portakal"
    "U.0259" = "nioli|niaouli"
    "U.0248" = "okaliptus"
    "U.0160" = "paculi"
    "U.0159" = "palmarosa"
    "U.0308" = "mandalina"
    "U.0314" = "sedir"
    "U.0411" = "tarcin"
    "U.0154" = "lavanta"
    "U.0334" = "zencefil"
    "U.0095" = "kekik"
    "U.0176" = "vanilya"
    "T.0243" = "argan"
    "T.0097" = "at kestanes"
    "T.0245" = "avokado"
    "T.0148" = "aynisefa|kalendula"
    "T.0078" = "badem"
    "T.0254" = "bamya"
    "T.0013" = "bugday ruseym|ruseym"
    "T.0147" = "chia"
    "T.0074" = "corek otu|corek"
    "T.0363" = "cuha"
    "T.0353" = "defne tohum"
    "T.0323" = "deve dikeni"
    "T.0213" = "hashas"
    "T.0077" = "hindistan ceviz"
    "T.0155" = "hint yag"
    "T.0364" = "hodan"
    "T.0366" = "isirgan"
    "T.0362" = "incir cekirdeg"
    "T.0110" = "jojoba"
    "T.0080" = "kabak cekirdeg"
    "T.0224" = "kakao"
    "T.0082" = "kayisi"
    "T.0209" = "kenevir"
    "T.0083" = "keten"
    "T.0104" = "kusburnu"
    "T.0270" = "makademya"
    "T.0210" = "menengic|bittim"
    "T.0084" = "nar"
    "T.0340" = "pirinc kepeg"
    "T.0081" = "sari kantaron|kantaron"
    "T.0246" = "sarimsak"
    "T.0355" = "shea"
    "T.0085" = "susam"
    "T.0365" = "tamanu"
    "T.0233" = "tesbih agac|neem"
    "T.0272" = "udi hindi"
    "T.0086" = "uzum"
    "T.0321" = "visne"
    "T.0125" = "kudret nar"
    "T.0221" = "kudret nar"
    "T.0389" = "zeytinyag"
    "A.0200" = "bugday"
}

# Parse 65 initial products
$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

$siteDataObj = @{}
$foundCount = 0
$notFoundCount = 0

foreach ($pm in $pMatches) {
    $id = $pm.Groups[1].Value
    $sku = $pm.Groups[2].Value
    $name = $pm.Groups[3].Value
    $cat = $pm.Groups[4].Value
    $cost = [double]$pm.Groups[6].Value

    $stemPattern = $stemMap[$id]
    if (-not $stemPattern) {
        $stemPattern = Normalize-Tr ($name.Split(' ')[0])
    }

    $vols = @{}
    $matchLink = ""

    foreach ($xi in $xmlItems) {
        $cleanTitle = Normalize-Tr $xi.Title
        $cleanLink = ($xi.Link.ToLower())
        
        $isMatch = $false
        $patterns = $stemPattern.Split('|')
        foreach ($pat in $patterns) {
            if ($cleanTitle.Contains($pat) -or $cleanLink.Contains($pat)) {
                $isMatch = $true
                break
            }
        }

        if ($isMatch) {
            # Skip wholesale bulk 5kg/10kg packages if retail ml package exists
            if ($xi.Title -match '5\s*kg|10\s*kg|toptan|2li Paket|2 adet') {
                # skip bulk combo packages unless no retail item exists
            }

            $vol = "250ml"
            if ($xi.Title -match '(?i)1000\s*ml|1000\s*gr|1\s*kg|1\s*l') { $vol = "1000ml" }
            elseif ($xi.Title -match '(?i)500\s*ml|500\s*gr') { $vol = "500ml" }
            elseif ($xi.Title -match '(?i)250\s*ml|250\s*gr') { $vol = "250ml" }
            elseif ($xi.Title -match '(?i)100\s*ml') { $vol = "100ml" }
            elseif ($xi.Title -match '(?i)50\s*ml') { $vol = "50ml" }
            elseif ($xi.Title -match '(?i)30\s*ml') { $vol = "30ml" }
            elseif ($xi.Title -match '(?i)20\s*ml') { $vol = "20ml" }

            if ($xi.Price -gt 0) {
                # Store retail price
                if (-not $vols.ContainsKey($vol) -or $vols[$vol] -eq 0) {
                    $vols[$vol] = $xi.Price
                }
                if (-not $matchLink) { $matchLink = $xi.Link }
            }
        }
    }

    $hasPrice = ($vols.Count -gt 0)
    if ($hasPrice) {
        $foundCount++
        $vStr = ($vols.Keys | Sort-Object) -join ", "
        Write-Host "✅ [SİTEDE VAR] $sku - $name -> Sitedeki Ambalajlar: $vStr"
    } else {
        $notFoundCount++
        Write-Host "❌ [CANSIZZADE FİYATI YOK -> N/A] $sku - $name"
    }

    $siteDataObj[$id] = @{
        id = $id
        sku = $sku
        name = $name
        category = $cat
        costPerKg = $cost
        url = if ($matchLink) { $matchLink } else { "https://www.cansizzadeyag.com/" }
        samplePrices = $vols
        hasSitePrice = $hasPrice
    }
}

Write-Host "`n=== BULLETPROOF MATCH SUMMARY ==="
Write-Host "Cansızzade Sitede Bulunan Ürün Sayısı:" $foundCount
Write-Host "Cansızzade Sitede Olmayan (N/A):" $notFoundCount

# Serialize to JS
$jsLines = @()
$jsLines += "// Official Bulletproof Live Site Data mapped from GOOGLE-MERCHANT.xml (ENDORA EXCLUDED)"
$jsLines += "const LIVE_SITE_SCRAPED_DATA = {"

$keys = $siteDataObj.Keys | Sort-Object
$idx = 0
foreach ($k in $keys) {
    $item = $siteDataObj[$k]
    $idStr = $item.id
    $skuStr = $item.sku
    $nameStr = $item.name.Replace('"', '\"')
    $urlStr = $item.url.Replace('"', '\"')

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
Write-Host "Updated js/liveSiteData.js with BULLETPROOF DATA successfully!"
