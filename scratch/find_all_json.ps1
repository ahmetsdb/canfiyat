[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$matches = [regex]::Matches($req.Content, 'var\s+([a-zA-Z0-9_$]+)\s*=\s*(\{.*?\});', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Var matches:" $matches.Count
foreach ($m in $matches) {
    Write-Host "Var Name:" $m.Groups[1].Value
    if ($m.Groups[2].Value.Length -lt 1000) {
        Write-Host "Content:" $m.Groups[2].Value
    }
}
