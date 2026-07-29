[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$uri = "https://www.cansizzadeyag.com/product/related-options"

# Test different option IDs found on corek otu yagi (2: 50ml, 1: 250ml, 7: 1kg)
$params = @{
    "parent_product_id" = "72"
    "selected_options[0]" = "7" # 1 kg
}

try {
    $res = Invoke-WebRequest -Uri $uri -Method Post -Body $params -Headers @{ 
        "X-Requested-With" = "XMLHttpRequest"
        "User-Agent" = "Mozilla/5.0"
    }
    Write-Host "Response 1:" $res.Content
} catch {
    Write-Host "Error 1:" $_.Exception.Message
}
