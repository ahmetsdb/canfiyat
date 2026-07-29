[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)

# Extract XML items
$itemRegex = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$priceRegex = [regex]'<g:price>([\s\S]*?)<\/g:price>'
$linkRegex = [regex]'<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>'

$itemMatches = $itemRegex.Matches($xmlText)

Write-Host "Searching XML for all titles containing 'otu' or 'rek'..."

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    $tMatch = $titleRegex.Match($block)
    $pMatch = $priceRegex.Match($block)
    $lMatch = $linkRegex.Match($block)

    $title = if ($tMatch.Groups[1].Success) { $tMatch.Groups[1].Value } else { $tMatch.Groups[2].Value }
    $price = if ($pMatch.Success) { $pMatch.Groups[1].Value.Replace("TRY","").Replace("TL","").Trim() } else { "0" }
    $link  = if ($lMatch.Groups[1].Success) { $lMatch.Groups[1].Value } else { $lMatch.Groups[2].Value }

    # Search link or title for corek or otu
    if ($link -like "*corek*" -or $title -match '(?i)rek\s*otu|çörek|corek') {
        Write-Host "FOUND:" $title.Trim() "| Price:" $price "| Link:" $link.Trim()
    }
}
