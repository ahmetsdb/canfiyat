$ss = Get-Content 'C:\Users\ahmet\Downloads\asb_logo_extracted\xl\sharedStrings.xml' -Raw
$matches = [regex]::Matches($ss, '<t[^>]*>(.*?)</t>')
Write-Host "Total strings: $($matches.Count)"
for ($i = 0; $i -lt [Math]::Min(50, $matches.Count); $i++) {
    $txt = $matches[$i].Groups[1].Value
    Write-Host "String $i -> $txt"
}
