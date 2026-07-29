[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$scripts = [regex]::Matches($req.Content, '<script[^>]*>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Total script tags:" $scripts.Count

foreach ($s in $scripts) {
    $code = $s.Groups[1].Value
    if ($code -like '*subproduct*' -or $code -like '*variant*' -or $code -like '*price*') {
        Write-Host "--- MATCHED SCRIPT ---"
        Write-Host $code.Substring(0, [Math]::Min(500, $code.Length))
    }
}
