$ssContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\sharedStrings.xml' -Raw
$strings = [regex]::Matches($ssContent, '<t[^>]*>(.*?)</t>') | ForEach-Object { $_.Groups[1].Value }

$sheetContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\worksheets\sheet1.xml' -Raw
$rows = [regex]::Matches($sheetContent, '<row[^>]*>(.*?)</row>')

$items = @()

foreach ($r in $rows) {
    $rowStr = $r.Value
    $itemName = ''
    $qty = 0
    $unit = ''
    $revenue = 0

    if ($rowStr -match '<c r="E\d+"[^>]*t="s"[^>]*><v>(\d+)</v>') { $itemName = $strings[[int]$matches[1]] }
    if ($rowStr -match '<c r="H\d+"[^>]*><v>([^<]+)</v>') { $qty = [double]$matches[1] }
    if ($rowStr -match '<c r="I\d+"[^>]*t="s"[^>]*><v>(\d+)</v>') { $unit = $strings[[int]$matches[1]] }
    if ($rowStr -match '<c r="J\d+"[^>]*><v>([^<]+)</v>') { $revenue = [double]$matches[1] }

    if ($qty -gt 0) {
        $items += [PSCustomObject]@{ ItemName = $itemName; Qty = $qty; Unit = $unit; Revenue = $revenue }
    }
}

$items | Sort-Object -Property Qty -Descending | Select-Object -First 25 | Format-Table -AutoSize
