[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/8.4.3.0/storefront/assets/javascript/layout/product.js"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$matches = [regex]::Matches($req.Content, 'ajaxRequest\(\{\s*url:\s*([^,]+)')
Write-Host "ajaxRequest matches:" $matches.Count
foreach ($m in $matches) {
    Write-Host "URL expression:" $m.Groups[1].Value
}
