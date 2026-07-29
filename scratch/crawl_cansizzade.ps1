[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
Write-Host "Status:" $req.StatusCode
Write-Host "Content Length:" $req.Content.Length

$matches = [regex]::Matches($req.Content, '<a[^>]+href="([^"]+)"[^>]*>')
Write-Host "Total Links:" $matches.Count
$productLinks = @()
foreach ($m in $matches) {
    $href = $m.Groups[1].Value
    if ($href -like '*-p-*' -or $href -like '*/urun/*') {
        if ($productLinks -notcontains $href) {
            $productLinks += $href
        }
    }
}
Write-Host "Product Links Found:" $productLinks.Count
$productLinks | Select-Object -First 25
