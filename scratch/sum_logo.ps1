$content = Get-Content 'C:\Users\ahmet\Downloads\satislar_extracted\xl\worksheets\sheet1.xml' -Raw
$rows = [regex]::Matches($content, '<row[^>]*>(.*?)</row>')

$totalQty = 0
$totalAmount = 0

foreach ($r in $rows) {
    $c = $r.Value
    # Extract values inside <c r="H..."> (Quantity) and <c r="J..."> or <c r="K..."> (Amount)
    if ($c -match '<c r="H\d+"[^>]*><v>([^<]+)</v>') {
        $qty = [double]$matches[1]
        $totalQty += $qty
    }
    if ($c -match '<c r="J\d+"[^>]*><v>([^<]+)</v>') {
        $amt = [double]$matches[1]
        $totalAmount += $amt
    }
}

Write-Host "Total Quantity (KG/Litre/Adet):" $totalQty
Write-Host "Total Sales Revenue (TL):" $totalAmount
