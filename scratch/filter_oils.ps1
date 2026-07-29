$ssContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\sharedStrings.xml' -Raw
$strings = [regex]::Matches($ssContent, '<t[^>]*>(.*?)</t>') | ForEach-Object { $_.Groups[1].Value }

$sheetContent = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\worksheets\sheet1.xml' -Raw
$rows = [regex]::Matches($sheetContent, '<row[^>]*>(.*?)</row>')

$totalAllQty = 0
$totalOilQty = 0
$totalOilRevenue = 0

foreach ($r in $rows) {
    $rowStr = $m = $r.Value
    
    # Extract cell values
    $itemType = ''
    $itemName = ''
    $qty = 0
    $unit = ''
    $revenue = 0

    if ($rowStr -match '<c r="C\d+"[^>]*t="s"[^>]*><v>(\d+)</v>') { $itemType = $strings[[int]$matches[1]] }
    if ($rowStr -match '<c r="E\d+"[^>]*t="s"[^>]*><v>(\d+)</v>') { $itemName = $strings[[int]$matches[1]] }
    if ($rowStr -match '<c r="H\d+"[^>]*><v>([^<]+)</v>') { $qty = [double]$matches[1] }
    if ($rowStr -match '<c r="I\d+"[^>]*t="s"[^>]*><v>(\d+)</v>') { $unit = $strings[[int]$matches[1]] }
    if ($rowStr -match '<c r="J\d+"[^>]*><v>([^<]+)</v>') { $revenue = [double]$matches[1] }

    $totalAllQty += $qty

    $isPackaging = $itemName -like '*KAPAK*' -or $itemName -like '*ŞİŞE*' -or $itemName -like '*KAVANOZ*' -or $itemName -like '*BİDON*' -or $itemName -like '*NAKLİYE*' -or $itemName -like '*AMBALAJ*' -or $itemType -like '*(HM)*'

    if (-not $isPackaging -and ($unit -eq 'KG' -or $unit -eq 'LT' -or $itemName -like '*YAĞ*')) {
        $totalOilQty += $qty
        $totalOilRevenue += $revenue
    }
}

Write-Host "=========================================="
Write-Host "Total Raw Items Quantity (Including Empty Bottles/Caps/Jars):" $totalAllQty
Write-Host "FILTERED REAL OIL SALES ONLY Quantity (KG/LT):" $totalOilQty
Write-Host "FILTERED REAL OIL SALES Revenue (TL):" $totalOilRevenue
Write-Host "=========================================="
