[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$endpoints = @(
    "https://www.cansizzadeyag.com/product/related-options?product_id=72",
    "https://www.cansizzadeyag.com/product/related-options?parent_product_id=72",
    "https://www.cansizzadeyag.com/index.php?p=sub_products&product_id=72",
    "https://www.cansizzadeyag.com/api/v1/products/72"
)

foreach ($ep in $endpoints) {
    try {
        $res = Invoke-RestMethod -Uri $ep -Method Get -Headers @{ "X-Requested-With" = "XMLHttpRequest" }
        Write-Host "Endpoint $ep SUCCESS:"
        $res | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "Endpoint $ep Failed:" $_.Exception.Message
    }
}
