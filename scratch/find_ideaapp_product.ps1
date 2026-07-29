[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/urun/corek-otu-yagi"
$req = Invoke-WebRequest -Uri $uri -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

$idx = $req.Content.IndexOf('IdeaApp.product')
if ($idx -gt 0) {
    Write-Host "IdeaApp.product snippet:"
    Write-Host $req.Content.Substring($idx, [Math]::Min(1500, $req.Content.Length - $idx))
}
