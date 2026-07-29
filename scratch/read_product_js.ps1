[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/8.4.3.0/storefront/assets/javascript/layout/product.js"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

Write-Host "Length:" $req.Content.Length
$matches = [regex]::Matches($req.Content, '(\/product\/[^\s"'']+|\/ajax\/[^\s"'']+|url:\s*["''][^"'']+["''])')
Write-Host "URL matches in product.js:" $matches.Count
foreach ($m in $matches) {
    Write-Host "URL:" $m.Value
}
