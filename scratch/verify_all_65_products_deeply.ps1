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
$xmlItems = @()

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

    if ($title -like "*Endora*" -or $title -like "*endora*" -or $link -like "*endora*" -or $brand -like "*Endora*") {
        continue
    }

    $priceVal = 0.0
    [double]::TryParse($price, [ref]$priceVal) | Out-Null

    if ($priceVal -gt 0) {
        $xmlItems += [PSCustomObject]@{
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

$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)", category: "([^"]+)", kdv: (\d+), unit: "[^"]+", costPerKg: ([\d\.]+)'
$pMatches = $pRegex.Matches($jsText)

Write-Host "=== SEARCHING ALL 65 MASTER PRODUCTS IN XML ==="

foreach ($pm in $pMatches) {
    $sku = $pm.Groups[2].Value
    $name = $pm.Groups[3].Value

    $normName = Norm $name
    $parts = $normName.Split(' ')
    $w1 = if ($parts.Count -gt 0) { $parts[0] } else { "" }
    $w2 = if ($parts.Count -gt 1) { $parts[1] } else { "" }

    $foundList = [System.Collections.Generic.List[PSCustomObject]]::new()

    foreach ($xi in $xmlItems) {
        $nt = Norm $xi.Title
        $nl = Norm $xi.Link

        if ($w1 -and ($nt.Contains($w1) -or $nl.Contains($w1))) {
            if ($w2 -and $w2 -notmatch 'yagi|ucucu|tohumu|cekirdegi|sabit|ozuyagi') {
                if ($nt.Contains($w2) -or $nl.Contains($w2)) {
                    $foundList.Add($xi)
                }
            } else {
                $foundList.Add($xi)
            }
        }
    }

    if ($foundList.Count -gt 0) {
        Write-Host "✅ $sku - $name ($($foundList.Count) items found):"
        foreach ($item in $foundList) {
            Write-Host "     * $($item.Title) | Price: $($item.Price) TL | Link: $($item.Link)"
        }
    } else {
        Write-Host "❌ $sku - $name : NO XML ITEMS FOUND IN FEED"
    }
}
