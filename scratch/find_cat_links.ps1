[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$matches = [regex]::Matches($req.Content, '<a[^>]+href="([^"]+)"[^>]*>')
Write-Host "Total links:" $matches.Count
foreach ($m in $matches) {
    $h = $m.Groups[1].Value
    if ($h -like '*kategori*' -or $h -like '*urun*' -or $h -like '*yag*') {
        Write-Host "Link:" $h
    }
}
