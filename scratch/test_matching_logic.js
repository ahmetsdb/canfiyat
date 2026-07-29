const fs = require('fs');

const productsDataContent = fs.readFileSync('js/productsData.js', 'utf8');
const liveSiteDataContent = fs.readFileSync('js/liveSiteData.js', 'utf8');

eval(productsDataContent);
eval(liveSiteDataContent);

console.log("Total INITIAL_PRODUCTS:", INITIAL_PRODUCTS.length);
console.log("Total LIVE_SITE_SCRAPED_DATA:", LIVE_SITE_SCRAPED_DATA.length);

let matchedCount = 0;
let unmatchedList = [];

INITIAL_PRODUCTS.forEach(product => {
    let siteItem = LIVE_SITE_SCRAPED_DATA.find(s => {
        const sTitle = ((s && (s.title || s.name)) || "").toLowerCase().replace(/yağı|yag|–|-|\s/g, "");
        const pName = ((product && product.name) || "").toLowerCase().replace(/yağı|yag|–|-|\s/g, "");
        return sTitle.includes(pName) || pName.includes(sTitle);
    });

    if (siteItem) {
        matchedCount++;
    } else {
        unmatchedList.push(product.name);
    }
});

console.log(`Matched ${matchedCount} / ${INITIAL_PRODUCTS.length} products.`);
if (unmatchedList.length > 0) {
    console.log("Unmatched products:", unmatchedList);
}
