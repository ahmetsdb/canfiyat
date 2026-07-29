[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Read INITIAL_PRODUCTS names from productsData.js
$pContent = Get-Content "js/productsData.js" -Raw
$pMatches = [regex]::Matches($pContent, 'name:\s*"([^"]+)"')
Write-Host "INITIAL_PRODUCTS count:" $pMatches.Count

# Read LIVE_SITE_SCRAPED_DATA titles from liveSiteData.js
$lContent = Get-Content "js/liveSiteData.js" -Raw
$lMatches = [regex]::Matches($lContent, 'name:\s*"([^"]+)"')
Write-Host "LIVE_SITE_SCRAPED_DATA count:" $lMatches.Count

$matched = 0
foreach ($pm in $pMatches) {
    $pName = $pm.Groups[1].Value
    $pNorm = ($pName.ToLower() -replace '[^\w]', '')
    
    $found = $false
    foreach ($lm in $lMatches) {
        $lName = $lm.Groups[1].Value
        $lNorm = ($lName.ToLower() -replace '[^\w]', '')
        if ($lNorm.Contains($pNorm) -or $pNorm.Contains($lNorm)) {
            $found = $true
            break
        }
    }
    if ($found) {
        $matched++
    } else {
        Write-Host "Unmatched product:" $pName
    }
}

Write-Host "Matched total:" $matched "of" $pMatches.Count
