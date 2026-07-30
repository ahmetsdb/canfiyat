[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)
$jsText  = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)

# 1. Parse XML Items
$itemRegex  = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$priceRegex = [regex]'<g:price>([\s\S]*?)<\/g:price>'
$linkRegex  = [regex]'<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>'
$brandRegex = [regex]'<g:brand><!\[CDATA\[([\s\S]*?)\]\]><\/g:brand>|<g:brand>([\s\S]*?)<\/g:brand>'
$idRegex    = [regex]'<g:id>([\s\S]*?)<\/g:id>'

$itemMatches = $itemRegex.Matches($xmlText)
$xmlItems = @()

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    $tMatch = $titleRegex.Match($block)
    $pMatch = $priceRegex.Match($block)
    $lMatch = $linkRegex.Match($block)
    $bMatch = $brandRegex.Match($block)
    $idMatch = $idRegex.Match($block)

    $title = if ($tMatch.Groups[1].Success) { $tMatch.Groups[1].Value } else { $tMatch.Groups[2].Value }
    $price = if ($pMatch.Success) { $pMatch.Groups[1].Value.Replace("TRY","").Replace("TL","").Trim() } else { "0" }
    $link  = if ($lMatch.Groups[1].Success) { $lMatch.Groups[1].Value } else { $lMatch.Groups[2].Value }
    $brand = if ($bMatch.Groups[1].Success) { $bMatch.Groups[1].Value } else { $bMatch.Groups[2].Value }
    $itemId = if ($idMatch.Success) { $idMatch.Groups[1].Value } else { "" }

    # EXCLUDE ENDORA
    if ($title -like "*Endora*" -or $title -like "*endora*" -or $link -like "*endora*" -or $brand -like "*Endora*") {
        continue
    }

    # EXCLUDE TEST / UNUSABLE ITEMS
    if ($title -match '(?i)test|satin alinmaz' -or $price -eq "0" -or [string]::IsNullOrWhiteSpace($title)) {
        continue
    }

    $priceVal = 0.0
    [double]::TryParse($price, [ref]$priceVal) | Out-Null

    if ($priceVal -gt 0) {
        $xmlItems += [PSCustomObject]@{
            Id    = $itemId.Trim()
            Title = $title.Trim()
            Price = $priceVal
            Link  = $link.Trim()
        }
    }
}

function Norm($str) {
    if (-not $str) { return "" }
    $s = $str.ToLower().Trim()
    $s = $s.Replace("ç","c").Replace("ğ","g").Replace("ı","i").Replace("i̇","i").Replace("ö","o").Replace("ş","s").Replace("ü","u")
    return $s
}

# 2. Extract Product Definitions from js/productsData.js
$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

$products = @()
foreach ($pm in $pMatches) {
    $products += [PSCustomObject]@{
        Id        = $pm.Groups[1].Value
        Sku       = $pm.Groups[2].Value
        Name      = $pm.Groups[3].Value
        Category  = $pm.Groups[4].Value
        CostPerKg = [double]$pm.Groups[6].Value
    }
}

# Single OR-Matched Keywords for Each Product
$productSlugMap = @{
    "U.0271" = @("yasemin")
    "U.0326" = @("bergamot")
    "U.0235" = @("biberiye")
    "U.0313" = @("citronella")
    "U.0320" = @("cay agaci", "cay-agaci")
    "T.0407" = @("defne yapragi", "defne-yapragi")
    "U.0332" = @("greyfurt")
    "U.0106" = @("tomurcuk")
    "U.0105" = @("karanfil yaprak", "karanfil-yaprak")
    "U.0199" = @("peppermint", "nane ucucu")
    "U.0155" = @("intermedia")
    "U.285"  = @("portakal")
    "U.0259" = @("nioli", "niaouli")
    "U.0248" = @("okaliptus")
    "U.0160" = @("paculi")
    "U.0159" = @("palmarosa")
    "U.0308" = @("mandalina")
    "U.0314" = @("sedir")
    "U.0411" = @("tarcin")
    "U.0154" = @("angustifolia")
    "U.0334" = @("zencefil")
    "U.0095" = @("kekik yagi")
    "U.0176" = @("vanilya")
    "T.0243" = @("argan")
    "T.0097" = @("at kestanesi", "at-kestanesi")
    "T.0245" = @("avokado")
    "T.0148" = @("aynisefa", "kalendula")
    "T.0078" = @("tatli badem", "tatli-badem", "badem (tatli)")
    "T.0254" = @("bamya")
    "T.0013" = @("bugday ruseym", "bugday-ruseym", "bugday ozu")
    "T.0147" = @("chia")
    "T.0074" = @("corek otu", "corek-otu")
    "T.0363" = @("cuha")
    "T.0353" = @("defne tohumu", "defne-tohumu")
    "T.0323" = @("deve dikeni", "deve-dikeni")
    "T.0213" = @("hashas")
    "T.0077" = @("hindistan cevizi", "hindistan-cevizi")
    "T.0155_sabit" = @("hint yagi", "hint-yagi")
    "T.0364" = @("hodan")
    "T.0366" = @("isirgan")
    "T.0362" = @("incir cekirdegi", "incir-cekirdegi")
    "T.0110" = @("jojoba")
    "T.0080" = @("kabak cekirdegi", "kabak-cekirdegi")
    "T.0224" = @("kakao")
    "T.0082" = @("kayisi cekirdegi", "kayisi-cekirdegi")
    "T.0209" = @("kenevir", "kendir")
    "T.0083" = @("keten tohumu", "keten-tohumu")
    "T.0104" = @("kusburnu")
    "T.0270" = @("makademya")
    "T.0210" = @("menengic", "bittim")
    "T.0084" = @("nar cekirdegi", "nar-cekirdegi")
    "T.0340" = @("pirinc kepegi", "pirinc-kepegi")
    "T.0081" = @("sari kantaron", "sari-kantaron")
    "T.0246" = @("sarimsak")
    "T.0355" = @("shea")
    "T.0085" = @("susam yagi", "susam-yagi")
    "T.0365" = @("tamanu")
    "T.0233" = @("tesbih agaci", "neem")
    "T.0272" = @("udi hindi", "udi-hindi")
    "T.0086" = @("uzum cekirdegi", "uzum-cekirdegi")
    "T.0321" = @("visne")
    "T.0125" = @("kudret nari (zeytinyagli-meyveli)", "kudret-nari-zeytinyagli-posali")
    "T.0221" = @("kudret nari yagi (zeytinyagli-meyvesi suzulmus)", "kudret-nari-yagi-posasiz")
    "T.0389" = @("zeytinyagi")
    "A.0200" = @("bugday ruseym", "bugday-ruseym")
}

# 3. Master Matching Engine
$masterAudit = [ordered]@{}

foreach ($p in $products) {
    $prodId = $p.Id
    $prodSku = $p.Sku
    $prodName = $p.Name

    $keywords = $productSlugMap[$prodId]
    if (-not $keywords) {
        $keywords = @((Norm $prodName.Split(' ')[0]))
    }

    $matchedItems = @()

    foreach ($xi in $xmlItems) {
        $normTitle = Norm $xi.Title
        $normLink  = Norm $xi.Link

        $match = $false

        if ($prodId -eq "T.0125") {
            # Meyveli / Posalı
            if (($normTitle -like "*posa*" -or $normTitle -like "*meyve*" -or $normLink -like "*posa*" -or $normLink -like "*meyve*" -or $normTitle -eq "kudret nari (zeytinyagli-meyveli)") -and $normTitle -notlike "*suzme*" -and $normTitle -notlike "*posasiz*") {
                $match = $true
            }
        } elseif ($prodId -eq "T.0221") {
            # Süzülmüş / Posasız
            if ($normTitle -like "*suz*" -or $normTitle -like "*posasiz*" -or $normLink -like "*suz*" -or $normLink -like "*posasiz*") {
                $match = $true
            }
        } elseif ($prodId -eq "U.0106") {
            # Karanfil Tomurcuk
            if ($normTitle -like "*karanfil*" -and ($normTitle -like "*tomurcuk*" -or $normTitle -notlike "*yaprak*")) {
                $match = $true
            }
        } elseif ($prodId -eq "U.0105") {
            # Karanfil Yaprak
            if ($normTitle -like "*karanfil*" -and $normTitle -like "*yaprak*") {
                $match = $true
            }
        } elseif ($prodId -eq "U.0154") {
            # Lavanta Angustifolia
            if ($normTitle -like "*lavanta*" -and $normTitle -like "*angustifolia*") {
                $match = $true
            }
        } elseif ($prodId -eq "U.0155") {
            # Lavanta Intermedia
            if ($normTitle -like "*lavanta*" -and ($normTitle -like "*intermedia*" -or $normTitle -notlike "*angustifolia*")) {
                $match = $true
            }
        } else {
            # OR-Match: If title or link contains ANY of the keyword options
            foreach ($kw in $keywords) {
                $normKw = Norm $kw
                if ($normTitle.Contains($normKw) -or $normLink.Contains($normKw)) {
                    $match = $true
                    break
                }
            }
        }

        if ($match) {
            $matchedItems += $xi
        }
    }

    # Categorize matched XML items by Volume
    $volsObj = [ordered]@{}
    $primaryUrl = "https://www.cansizzadeyag.com/"

    foreach ($mi in $matchedItems) {
        # Exclude combo multi-packs
        if ($mi.Title -match '2li Paket|2 adet|10ml x 3|25 gr-100 ml|250 gr\+ 100 ml') {
            continue
        }

        $vKey = ""
        if ($mi.Title -match '(?i)\b5\s*kg\b|\b5\s*l\b|\b5\s*litre\b') { $vKey = "5000ml" }
        elseif ($mi.Title -match '(?i)\b1\s*kg\b|\b1\s*l\b|\b1\s*litre\b|\b1000\s*ml\b|\b1000\s*gr\b') { $vKey = "1000ml" }
        elseif ($mi.Title -match '(?i)\b500\s*ml\b|\b500\s*gr\b|\b0,5\s*kg\b|\b0\.5\s*kg\b') { $vKey = "500ml" }
        elseif ($mi.Title -match '(?i)\b250\s*ml\b|\b250\s*gr\b') { $vKey = "250ml" }
        elseif ($mi.Title -match '(?i)\b100\s*ml\b|\b100\s*gr\b') { $vKey = "100ml" }
        elseif ($mi.Title -match '(?i)\b50\s*ml\b|\b50\s*gr\b') { $vKey = "50ml" }
        elseif ($mi.Title -match '(?i)\b30\s*ml\b|\b30\s*gr\b') { $vKey = "30ml" }
        elseif ($mi.Title -match '(?i)\b20\s*ml\b|\b20\s*gr\b') { $vKey = "20ml" }
        elseif ($mi.Title -match '(?i)\b10\s*ml\b') { $vKey = "10ml" }
        else {
            if ($mi.Title -notmatch '(?i)ml|gr|kg|litre|\(kg\)') {
                $vKey = "250ml"
            }
        }

        # Exclude dökme bulk (kg) listings like "Susam Yağı (kg) 5 kg" = 700 TL
        if ($mi.Title -match '\(kg\)') {
            continue
        }

        if ($vKey -and $mi.Price -gt 0) {
            # Prefer smaller price if retail bottle vs calculated bulk
            if (-not $volsObj.Contains($vKey) -or ($volsObj[$vKey].Price -gt 1500 -and $mi.Price -lt 1500)) {
                $volsObj[$vKey] = [PSCustomObject]@{
                    Price = $mi.Price
                    Title = $mi.Title
                    Link  = $mi.Link
                }
            }
            if ($primaryUrl -eq "https://www.cansizzadeyag.com/" -and $mi.Link) {
                $primaryUrl = $mi.Link
            }
        }
    }

    $masterAudit[$prodId] = [PSCustomObject]@{
        Id           = $prodId
        Sku          = $prodSku
        Name         = $prodName
        Url          = $primaryUrl
        Volumes      = $volsObj
        HasSitePrice = ($volsObj.Count -gt 0)
    }
}

# 4. Print Full Detailed Audit Log
Write-Host "`n=========================================================================================="
Write-Host "                           MASTER XML AUDIT REPORT (65 PRODUCTS)"
Write-Host "=========================================================================================="

$totalSiteAvailable = 0
$totalSiteMissing = 0

foreach ($k in $masterAudit.Keys) {
    $item = $masterAudit[$k]
    if ($item.HasSitePrice) {
        $totalSiteAvailable++
        Write-Host "✅ [SİTEDE VAR] SKU: $($item.Sku) | Name: $($item.Name)"
        foreach ($vKey in $item.Volumes.Keys) {
            $vInfo = $item.Volumes[$vKey]
            Write-Host "     -> [$vKey]: $($vInfo.Price) TL | Title: '$($vInfo.Title)'"
        }
    } else {
        $totalSiteMissing++
        Write-Host "❌ [SİTEDE YOK - N/A] SKU: $($item.Sku) | Name: $($item.Name)"
    }
}

Write-Host "=========================================================================================="
Write-Host "Sitede Perakende Fiyatı Bulunan Ürün Sayısı: $totalSiteAvailable / 65"
Write-Host "Sitede Fiyatı Olmayan (N/A) Ürün Sayısı: $totalSiteMissing / 65"
Write-Host "=========================================================================================="

# 5. Generate Master js/liveSiteData.js File
$jsLines = @()
$jsLines += "// Official Audited & Verified Live Site Data Mapped Directly from GOOGLE-MERCHANT.xml"
$jsLines += "const LIVE_SITE_SCRAPED_DATA = {"

$keys = $masterAudit.Keys | Sort-Object
$idx = 0
foreach ($k in $keys) {
    $item = $masterAudit[$k]
    $idStr = $item.Id
    $skuStr = $item.Sku
    $nameStr = $item.Name.Replace('"', '\"')
    $urlStr = $item.Url.Replace('"', '\"')

    $pParts = @()
    foreach ($vk in $item.Volumes.Keys) {
        $pv = $item.Volumes[$vk].Price
        $pParts += "`"$vk`": $pv"
    }
    $pObjStr = "{" + ($pParts -join ", ") + "}"
    $hasPriceBool = if ($item.HasSitePrice) { "true" } else { "false" }

    $comma = if ($idx -lt ($keys.Count - 1)) { "," } else { "" }
    $jsLines += "  `"$idStr`": { id: `"$idStr`", sku: `"$skuStr`", name: `"$nameStr`", url: `"$urlStr`", samplePrices: $pObjStr, hasSitePrice: $hasPriceBool }$comma"
    $idx++
}

$jsLines += "};"

Set-Content -Path "js/liveSiteData.js" -Value ($jsLines -join "`n") -Encoding UTF8
Write-Host "Updated js/liveSiteData.js with MASTER AUDITED DATA successfully!"
