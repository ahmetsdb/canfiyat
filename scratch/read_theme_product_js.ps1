[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/idea/dj/79/themes/selftpl_5f8d521b321cf/renders/javascript/product.js"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

Write-Host "Length:" $req.Content.Length
$matches = [regex]::Matches($req.Content, '(\/ajax\/[^\s"'']+|\/urun\/[^\s"'']+|\/product\/[^\s"'']+|$.ajax\(\{.*?\}\))', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Matches in theme product.js:" $matches.Count
foreach ($m in $matches | Select-Object -First 15) {
    Write-Host "Match:" $m.Value
}
