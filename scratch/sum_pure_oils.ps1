$ssContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\sharedStrings.xml' -Raw
$strings = [regex]::Matches($ssContent, '<t[^>]*>(.*?)</t>') | ForEach-Object { $_.Groups[1].Value }

$sheetContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\worksheets\sheet1.xml' -Raw
$rows = [regex]::Matches($sheetContent, '<row[^>]*>(.*?)</row>')

$finishedOilQty = 0
$finishedOilRevenue = 0

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

    $isExcluded = $itemName -like '*POSA*' -or $itemName -like '*TOHUMU' -or $itemName -like '*SERAMİK*' -or $itemName -like '*KAPAK*' -or $itemName -like '*ŞİŞE*' -or $itemName -like '*KAVANOZ*' -or $itemName -like '*BİDON*' -or $itemName -like '*NAKLİYE*' -or $itemName -like '*NUMUNE*' -or $itemName -like '*KUTU*'

    if (-not $isExcluded -and ($itemName -like '*YAĞ*' -or $unit -eq 'KG' -or $unit -eq 'LT')) {
        $finishedOilQty += $qty
        $finishedOilRevenue += $revenue
    }
}

Write-Host "=========================================="
Write-Host "REAL FINISHED PURE OIL QUANTITY (KG/LT):" $finishedOilQty
Write-Host "REAL FINISHED PURE OIL REVENUE (TL):" $finishedOilRevenue
Write-Host "=========================================="
