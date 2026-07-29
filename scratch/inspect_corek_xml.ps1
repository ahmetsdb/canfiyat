[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)

# Extract XML items
$itemRegex = [regex]'<item>([\s\S]*?)<\/item>'
$itemMatches = $itemRegex.Matches($xmlText)

Write-Host "=== ALL ÇÖREK OTU ITEMS IN GOOGLE-MERCHANT.XML ==="

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    if ($block -match 'corek-otu|çörek|Çörek|ÇÖREK') {
        $id = [regex]::Match($block, '<g:id>([\s\S]*?)<\/g:id>').Groups[1].Value
        $title = [regex]::Match($block, '<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>').Groups[1].Value
        if (-not $title) { $title = [regex]::Match($block, '<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>').Groups[2].Value }
        
        $price = [regex]::Match($block, '<g:price>([\s\S]*?)<\/g:price>').Groups[1].Value
        $link = [regex]::Match($block, '<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>').Groups[1].Value
        if (-not $link) { $link = [regex]::Match($block, '<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>').Groups[2].Value }

        Write-Host "ID:" $id "| Title:" $title.Trim() "| Price:" $price "| Link:" $link.Trim()
    }
}
