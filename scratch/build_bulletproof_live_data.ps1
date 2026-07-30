[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)
$jsText  = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)

# Parse XML items, strictly excluding Endora
$itemRegex  = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$priceRegex = [regex]'<g:price>([\s\S]*?)<\/g:price>'
$linkRegex  = [regex]'<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>'
$brandRegex = [regex]'<g:brand><!\[CDATA\[([\s\S]*?)\]\]><\/g:brand>|<g:brand>([\s\S]*?)<\/g:brand>'

$itemMatches = $itemRegex.Matches($xmlText)
$xmlItems = [System.Collections.Generic.List[PSCustomObject]]::new()

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

    # EXCLUDE ENDORA
    if ($title -like "*Endora*" -or $title -like "*endora*" -or $link -like "*endora*" -or $brand -like "*Endora*") {
        continue
    }

    # EXCLUDE TEST ITEMS
    if ($title -match '(?i)test|satin alinmaz' -or $price -eq "0" -or [string]::IsNullOrWhiteSpace($title)) {
        continue
    }

    $priceVal = 0.0
    [double]::TryParse($price, [ref]$priceVal) | Out-Null

    if ($priceVal -gt 0) {
        $xmlItems.Add([PSCustomObject]@{
            Title = $title.Trim()
            Price = $priceVal
            Link  = $link.Trim()
        })
    }
}

function Norm($str) {
    if (-not $str) { return "" }
    $s = $str.ToLower().Trim()
    $s = $s.Replace("ç","c").Replace("ğ","g").Replace("ı","i").Replace("i̇","i").Replace("ö","o").Replace("ş","s").Replace("ü","u")
    return $s
}

# Master SKU mapping rules: Array of URL slug or Title stem triggers for each SKU
$skuTriggers = [ordered]@{
    "T.0074" = @("corek-otu", "corek otu")
    "T.0077" = @("hindistan-cevizi", "hindistan cevizi")
    "T.0078" = @("tatli-badem", "tatli badem", "badem (tatli)")
    "T.0080" = @("kabak-cekirdegi", "kabak cekirdegi")
    "T.0081" = @("sari-kantaron", "sari kantaron")
    "T.0082" = @("kayisi-cekirdegi", "kayisi cekirdegi")
    "T.0083" = @("keten-tohumu", "keten tohumu")
    "T.0084" = @("nar-cekirdegi", "nar cekirdegi")
    "T.0085" = @("susam-yagi", "susam yagi")
    "T.0086" = @("uzum-cekirdegi", "uzum cekirdegi")
    "T.0097" = @("at-kestanesi", "at kestanesi")
    "T.0104" = @("kusburnu-cekirdegi", "kusburnu cekirdegi")
    "T.0110" = @("jojoba")
    "T.0125" = @("kudret-nari-zeytinyagli", "kudret nari (zeytinyagli-meyveli)", "kudret-nari-zeytinyagli-posali")
    "T.0147" = @("chia-tohumu", "chia yagi", "chia tohumu")
    "T.0148" = @("aynisefa", "kalendula")
    "T.0155_sabit" = @("hint-yagi", "hint yagi")
    "T.0209" = @("kenevir", "kendir")
    "T.0210" = @("menengic", "bittim")
    "T.0213" = @("hashas")
    "T.0221" = @("kudret-nari-yagi-posasiz", "kudret nari yagi (zeytinyagli-meyvesi suzulmus)")
    "T.0224" = @("kakao")
    "T.0243" = @("argan")
    "T.0245" = @("avokado")
    "T.0246" = @("sarimsak")
    "T.0254" = @("bamya")
    "T.0272" = @("udi-hindi", "udi hindi")
    "T.0323" = @("deve-dikeni", "deve dikeni")
    "T.0353" = @("defne-tohumu", "defne tohumu")
    "T.0355" = @("shea-yagi", "shea yagi", "shea butter")
    "T.0362" = @("incir-cekirdegi", "incir cekirdegi")
    "T.0366" = @("isirgan")
    "T.0389" = @("zeytinyagi-cold-press", "cold press zeytinyagi", "zeytinyagi (soguk sikim)")
    "A.0200" = @("bugday-ruseym", "bugday ruseym", "bugday oz")
    "U.0259" = @("nioli", "niaouli")
}

$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

$masterAudit = [ordered]@{}

foreach ($pm in $pMatches) {
    $prodId = $pm.Groups[1].Value
    $prodSku = $pm.Groups[2].Value
    $prodName = $pm.Groups[3].Value

    $triggers = $skuTriggers[$prodId]

    $matchedXml = [System.Collections.Generic.List[PSCustomObject]]::new()

    if ($triggers) {
        foreach ($xi in $xmlItems) {
            $nt = Norm $xi.Title
            $nl = Norm $xi.Link

            foreach ($tr in $triggers) {
                $ntr = Norm $tr
                if ($nt.Contains($ntr) -or $nl.Contains($ntr)) {
                    $matchedXml.Add($xi)
                    break
                }
            }
        }
    }

    # Volume extraction for matched items
    $volsObj = [ordered]@{}
    $primaryUrl = "https://www.cansizzadeyag.com/"

    foreach ($mi in $matchedXml) {
        # Skip multi-pack combo deals
        if ($mi.Title -match '2li Paket|2 adet|10ml x 3|25 gr-100 ml|250 gr\+ 100 ml') {
            continue
        }
        # Skip bulk dökme listings if retail bottle is present
        if ($mi.Title -match '\(kg\)') {
            continue
        }

        $vKey = ""
        if ($mi.Title -match '(?i)\b5\s*kg\b|\b5\s*l\b|\b5\s*litre\b') { $vKey = "5000ml" }
        elseif ($mi.Title -match '(?i)\b1\s*kg\b|\b1\s*l\b|\b1\s*litre\b|\b1000\s*ml\b|\b1000\s*gr\b') { $vKey = "1000ml" }
        elseif ($mi.Title -match '(?i)\b500\s*ml\b|\b500\s*gr\b|\b0,5\s*kg\b|\b0\.5\s*kg\b') { $vKey = "500ml" }
        elseif ($mi.Title -match '(?i)\b250\s*ml\b|\b250\s*gr\b') { $vKey = "250ml" }
        elseif ($mi.Title -match '(?i)\b150\s*ml\b|\b150\s*gr\b') { $vKey = "150ml" }
        elseif ($mi.Title -match '(?i)\b100\s*ml\b|\b100\s*gr\b') { $vKey = "100ml" }
        elseif ($mi.Title -match '(?i)\b50\s*ml\b|\b50\s*gr\b') { $vKey = "50ml" }
        elseif ($mi.Title -match '(?i)\b30\s*ml\b|\b30\s*gr\b') { $vKey = "30ml" }
        elseif ($mi.Title -match '(?i)\b20\s*ml\b|\b20\s*gr\b') { $vKey = "20ml" }
        elseif ($mi.Title -match '(?i)\b10\s*ml\b') { $vKey = "10ml" }
        else {
            if ($mi.Title -notmatch '(?i)ml|gr|kg|litre') {
                $vKey = "250ml"
            }
        }

        if ($vKey -and $mi.Price -gt 0) {
            # Prefer clean retail price over outlier
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

Write-Host "`n=========================================================================================="
Write-Host "                           BULLETPROOF MASTER XML AUDIT REPORT"
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
            Write-Host "     -> [$vKey]: $($vInfo.Price) TL | Title: '$($vInfo.Title)' | Link: '$($vInfo.Link)'"
        }
    } else {
        $totalSiteMissing++
        Write-Host "❌ [SİTEDE YOK - N/A] SKU: $($item.Sku) | Name: $($item.Name)"
    }
}

Write-Host "=========================================================================================="
Write-Host "Sitede Perakende Satışı Bulunan Ürün Sayısı: $totalSiteAvailable / 65"
Write-Host "Sitede Satışı Olmayan (N/A) Ürün Sayısı: $totalSiteMissing / 65"
Write-Host "=========================================================================================="

# Generate Master js/liveSiteData.js File
$jsLines = @()
$jsLines += "// Official Bulletproof Live Site Data Mapped Directly from GOOGLE-MERCHANT.xml"
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
Write-Host "Updated js/liveSiteData.js with BULLETPROOF DATA successfully!"
