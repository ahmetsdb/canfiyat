[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)

$matches = [regex]::Matches($xmlText, '<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>')

Write-Host "Total titles in XML:" $matches.Count
Write-Host "`nFirst 40 Titles in XML:"
for ($i = 0; $i -lt [Math]::Min(40, $matches.Count); $i++) {
    $m = $matches[$i]
    $val = if ($m.Groups[1].Success) { $m.Groups[1].Value } else { $m.Groups[2].Value }
    Write-Host ($i+1) ":" $val.Trim()
}
