[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$xmlText = [System.IO.File]::ReadAllText("C:\Users\ahmet\Downloads\GOOGLE-MERCHANT.xml", [System.Text.Encoding]::UTF8)

# Map of explicit 5 KG XML prices
$prices5kg = @{
    "T.0074" = 1000  # Çörek Otu Yağı 5 kg
    "T.0077" = 3200  # Hindistan Cevizi Yağı 5 kg
    "T.0078" = 1000  # Tatlı Badem Yağı 5 kg
    "T.0080" = 2200  # Kabak Çekirdeği Yağı 5 kg
    "T.0081" = 740.74 # Sarı Kantaron 5kg per kg or total
    "T.0082" = 701.39
    "T.0083" = 1900  # Keten Tohumu Yağı 5 kg
    "T.0084" = 748.15
    "T.0085" = 700   # Susam Yağı 5 kg
    "T.0086" = 748.15
    "T.0097" = 750
    "T.0110" = 7000  # Jojoba Yağı 5 kg
    "T.0147" = 990
    "T.0155_sabit" = 2500 # Hint Yağı 5 kg
    "T.0209" = 1250
    "T.0210" = 3100  # Menengiç 5 kg
    "T.0213" = 3600  # Haşhaş 5 kg
    "T.0224" = 9500  # Kakao Yağı 5 kg
    "T.0243" = 2200
    "T.0245" = 1250
    "T.0254" = 2700  # Bamya 5 kg
    "T.0323" = 800
    "T.0353" = 2700  # Defne Tohumu 5 kg
    "T.0355" = 21000 # Shea 25 kg
    "T.0366" = 2700
}

# Update js/liveSiteData.js
$jsContent = [System.IO.File]::ReadAllText("js/liveSiteData.js", [System.Text.Encoding]::UTF8)

# Replace existing samplePrices to include 5000ml where applicable
foreach ($key in $prices5kg.Keys) {
    $p5 = $prices5kg[$key]
    if ($jsContent -match "`"$key`":\s*\{[^}]+\}") {
        # inject "5000ml": price inside samplePrices
        $jsContent = $jsContent -replace "(`"$key`":\s*\{[^\}]+samplePrices:\s*\{)([^}]*)(\})", "`$1`$2, `"5000ml`": $p5`$3"
    }
}

Set-Content -Path "js/liveSiteData.js" -Value $jsContent -Encoding UTF8
Write-Host "Updated js/liveSiteData.js with 5 KG prices successfully!"
