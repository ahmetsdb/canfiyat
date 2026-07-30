[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$jsText = [System.IO.File]::ReadAllText("js/productsData.js", [System.Text.Encoding]::UTF8)
$pRegex = [regex]'\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)"'
$pMatches = $pRegex.Matches($jsText)

Write-Host "=== ALL INITIAL PRODUCTS IN JS ==="
foreach ($m in $pMatches) {
    Write-Host $m.Groups[1].Value "|" $m.Groups[2].Value "|" $m.Groups[3].Value
}
