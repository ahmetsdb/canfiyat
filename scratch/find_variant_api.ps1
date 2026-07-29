[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$idx = $req.Content.IndexOf('variant')
Write-Host "Searching variant scripts..."
$matches = [regex]::Matches($req.Content, '(\/ajax\/[^"''\s]+|\/variant[^"''\s]+|variantData\s*=\s*\{.*?\})')
Write-Host "Found matches:" $matches.Count
foreach ($m in $matches | Select-Object -First 15) {
    Write-Host "Match:" $m.Value
}
