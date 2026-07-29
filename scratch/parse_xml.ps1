$content = Get-Content 'C:\Users\ahmet\Downloads\satislar_extracted\xl\worksheets\sheet1.xml' -Raw
$matches = [regex]::Matches($content, '<row[^>]*>(.*?)</row>')
Write-Host "Total Rows: $($matches.Count)"
for ($i = [Math]::Max(0, $matches.Count - 20); $i -lt $matches.Count; $i++) {
    Write-Host "Row $i : $($matches[$i].Value)"
}
