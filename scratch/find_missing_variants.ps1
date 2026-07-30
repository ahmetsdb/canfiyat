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

    # Exclude Endora
    if ($title -like "*Endora*" -or $title -like "*endora*" -or $link -like "*endora*" -or $brand -like "*Endora*") {
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

Write-Host "Total Pure Cansizzade XML Items:" $xmlItems.Count
Write-Host "`nListing ALL Pure Cansizzade XML Item Titles & Prices:"
$xmlItems | ForEach-Object { Write-Host " - " $_.Title "| Price:" $_.Price "| Link:" $_.Link }
