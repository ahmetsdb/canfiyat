[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/8.4.3.0/storefront/assets/javascript/layout/product.js"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$idx = $req.Content.IndexOf('related-options')
if ($idx -gt 0) {
    $start = [Math]::Max(0, $idx - 300)
    $len = [Math]::Min(1000, $req.Content.Length - $start)
    Write-Host "Snippet around related-options:"
    Write-Host $req.Content.Substring($start, $len)
}
