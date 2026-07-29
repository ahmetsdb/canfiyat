[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)

# Extract XML items
$itemRegex = [regex]'<item>([\s\S]*?)<\/item>'
$titleRegex = [regex]'<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>'
$brandRegex = [regex]'<g:brand><!\[CDATA\[([\s\S]*?)\]\]><\/g:brand>|<g:brand>([\s\S]*?)<\/g:brand>'

$itemMatches = $itemRegex.Matches($xmlText)

$endoraCount = 0
$cansizzadeCount = 0
$endoraTitles = @()
$cansizzadeTitles = @()

foreach ($im in $itemMatches) {
    $block = $im.Groups[1].Value
    $tMatch = $titleRegex.Match($block)
    $bMatch = $brandRegex.Match($block)

    $title = if ($tMatch.Groups[1].Success) { $tMatch.Groups[1].Value } else { $tMatch.Groups[2].Value }
    $brand = if ($bMatch.Groups[1].Success) { $bMatch.Groups[1].Value } else { $bMatch.Groups[2].Value }

    $isEndora = ($title -like "*Endora*" -or $brand -like "*Endora*")

    if ($isEndora) {
        $endoraCount++
        $endoraTitles += $title.Trim()
    } else {
        $cansizzadeCount++
        $cansizzadeTitles += $title.Trim()
    }
}

Write-Host "=== ENDORA VS CANSIZZADE XML ANALYSIS ==="
Write-Host "Total XML Items:" $itemMatches.Count
Write-Host "Endora Brand Items Found:" $endoraCount
Write-Host "Pure Cansızzade Brand Items Found:" $cansizzadeCount

Write-Host "`nSample ENDORA items found in XML (MUST BE EXCLUDED):"
$endoraTitles | Select-Object -First 20 | ForEach-Object { Write-Host " - " $_ }
