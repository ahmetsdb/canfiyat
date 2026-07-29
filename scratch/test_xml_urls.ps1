[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$urls = @(
    "https://www.cansizzadeyag.com/xml/google",
    "https://www.cansizzadeyag.com/xml/google.xml",
    "https://www.cansizzadeyag.com/xml/facebook.xml",
    "https://www.cansizzadeyag.com/xml/akakce.xml",
    "https://www.cansizzadeyag.com/xml/cimri.xml",
    "https://www.cansizzadeyag.com/xml/ciceksepeti.xml",
    "https://www.cansizzadeyag.com/xml/n11.xml",
    "https://www.cansizzadeyag.com/xml/export.xml",
    "https://www.cansizzadeyag.com/xml"
)

foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $u -UserAgent "Mozilla/5.0" -TimeoutSec 4 -ErrorAction Stop
        Write-Host "FOUND ACTIVE XML:" $u "Length:" $res.Content.Length "bytes"
    } catch {
        Write-Host "Not found / 404:" $u
    }
}
