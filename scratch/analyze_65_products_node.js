const fs = require('fs');

const productsDataContent = fs.readFileSync('js/productsData.js', 'utf8');
const xmlContent = fs.readFileSync('C:/Users/ahmet/Downloads/GOOGLE-MERCHANT.xml', 'utf8');

eval(productsDataContent);

// Simple XML item parser
const itemRegex = /<item>([\s\S]*?)<\/item>/g;
let match;
const xmlItems = [];

while ((match = itemRegex.exec(xmlContent)) !== null) {
    const itemBlock = match[1];
    const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(itemBlock) || /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
    const priceMatch = /<g:price>([\s\S]*?)<\/g:price>/i.exec(itemBlock);
    const linkMatch = /<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i.exec(itemBlock) || /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);

    const title = titleMatch ? titleMatch[1].trim() : "";
    const price = priceMatch ? parseFloat(priceMatch[1].replace("TRY","").replace("TL","").trim()) : 0;
    const link = linkMatch ? linkMatch[1].trim() : "";

    if (title) {
        xmlItems.push({ title, price, link });
    }
}

console.log(`Total XML items extracted: ${xmlItems.length}`);

// Function to normalize Turkish product names for accurate matching
function normalizeName(str) {
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/yağı|yagi|yag|uçucu|ucucu|yağlar|yaglar|peppermint|angustifolia|intermedia|tomurcuk|yaprak|refined|soğuk|sıkım|soguk|sikim|meyveli|süzülmüş|suzulmus/gi, '')
        .replace(/[^a-z0-9]/gi, '');
}

const matchingMap = {};

INITIAL_PRODUCTS.forEach(product => {
    const pNorm = normalizeName(product.name);
    const availableVolumes = {};

    xmlItems.forEach(item => {
        const itemNorm = normalizeName(item.title);
        if (itemNorm.includes(pNorm) || pNorm.includes(itemNorm)) {
            // Detect volume
            let vol = "250ml";
            if (/1000\s*ml|1000\s*gr|1\s*kg|1\s*l/i.test(item.title)) vol = "1000ml";
            else if (/500\s*ml|500\s*gr/i.test(item.title)) vol = "500ml";
            else if (/250\s*ml|250\s*gr/i.test(item.title)) vol = "250ml";
            else if (/100\s*ml/i.test(item.title)) vol = "100ml";
            else if (/50\s*ml/i.test(item.title)) vol = "50ml";
            else if (/30\s*ml/i.test(item.title)) vol = "30ml";
            else if (/20\s*ml/i.test(item.title)) vol = "20ml";

            availableVolumes[vol] = {
                price: item.price,
                link: item.link,
                rawTitle: item.title
            };
        }
    });

    matchingMap[product.id] = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        costPerKg: product.costPerKg,
        availableVolumes: availableVolumes,
        hasAnyOnSite: Object.keys(availableVolumes).length > 0
    };
});

let foundCount = 0;
let notFoundCount = 0;

Object.values(matchingMap).forEach(p => {
    if (p.hasAnyOnSite) {
        foundCount++;
        console.log(`[FOUND] ${p.sku} - ${p.name}: Available volumes ->`, Object.keys(p.availableVolumes).join(", "));
    } else {
        notFoundCount++;
        console.log(`[NOT ON SITE] ${p.sku} - ${p.name}`);
    }
});

console.log(`\nSUMMARY: ${foundCount} products available on site, ${notFoundCount} products NOT on site (will show N/A).`);

// Save mapping result to JSON file
fs.writeFileSync('scratch/product_xml_matches.json', JSON.stringify(matchingMap, null, 2), 'utf8');
