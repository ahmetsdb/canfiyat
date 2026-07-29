[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$idx = $req.Content.IndexOf('product-price')
if ($idx -gt 0) {
    $start = [Math]::Max(0, $idx - 500)
    $len = [Math]::Min(2000, $req.Content.Length - $start)
    Write-Host "HTML around product-price:"
    Write-Host $req.Content.Substring($start, $len)
}
