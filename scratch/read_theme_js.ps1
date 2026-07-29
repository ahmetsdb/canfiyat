[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/idea/dj/79/themes/selftpl_5f8d521b321cf/renders/javascript/theme.js"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

Write-Host "Length:" $req.Content.Length
$matches = [regex]::Matches($req.Content, '(\/ajax\/[^\s"'']+|\/product\/[^\s"'']+|variant[a-zA-Z0-9_-]*)')
Write-Host "Matches in theme.js:" $matches.Count
foreach ($m in $matches | Select-Object -First 20) {
    Write-Host "Match:" $m.Value
}
