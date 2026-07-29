[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/product/related-options"
$body = @{
    productId = "72"
}
try {
    $res = Invoke-RestMethod -Uri $uri -Method Post -Body $body -Headers @{ "X-Requested-With" = "XMLHttpRequest" }
    Write-Host "Success Response:"
    $res | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error:" $_.Exception.Message
}
