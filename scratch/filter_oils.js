const fs = require('fs');

// Read sharedStrings
const ssFile = 'C:\\Users\\ahmet\\Downloads\\asb_logo_extracted\\xl\\sharedStrings.xml';
const sheetFile = 'C:\\Users\\ahmet\\Downloads\\asb_logo_extracted\\xl\\worksheets\\sheet1.xml';

const ssContent = fs.readFileSync(ssFile, 'utf8');
const strings = [];
const matches = ssContent.match(/<t[^>]*>(.*?)<\/t>/g);
if (matches) {
    matches.forEach(m => {
        strings.push(m.replace(/<[^>]+>/g, ''));
    });
}

const sheetContent = fs.readFileSync(sheetFile, 'utf8');
const rows = sheetContent.match(/<row[^>]*>(.*?)<\/row>/g);

let totalOilQty = 0;
let totalOilRevenue = 0;
let totalAllQty = 0;

let oilItems = [];

rows.forEach(rowStr => {
    // extract cell values
    const cMatches = rowStr.match(/<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/g);
    if (!cMatches) return;

    let cellMap = {};
    cMatches.forEach(c => {
        const col = c.match(/r="([A-Z]+)\d+"/)[1];
        const isString = c.includes('t="s"');
        const vMatch = c.match(/<v>([^<]+)<\/v>/);
        if (vMatch) {
            let val = vMatch[1];
            if (isString) {
                val = strings[parseInt(val)] || val;
            }
            cellMap[col] = val;
        }
    });

    const itemType = cellMap['C'] || '';
    const itemCode = cellMap['D'] || '';
    const itemName = cellMap['E'] || '';
    const qty = parseFloat(cellMap['H']) || 0;
    const unit = cellMap['I'] || '';
    const revenue = parseFloat(cellMap['J']) || 0;

    totalAllQty += qty;

    // Filter out packaging, bottles, jars, shipping fees, raw seeds (HM)
    const isPackaging = itemName.includes('KAPAK') || itemName.includes('ŞİŞE') || itemName.includes('KAVANOZ') || itemName.includes('BİDON') || itemName.includes('NAKLİYE') || itemName.includes('KUTU') || itemName.includes('AMBALAJ') || itemType.includes('HM');
    
    if (!isPackaging && (unit === 'KG' || unit === 'LT' || unit === 'LİTRE' || itemName.includes('YAĞI'))) {
        totalOilQty += qty;
        totalOilRevenue += revenue;
        oilItems.push({ itemCode, itemName, qty, unit, revenue });
    }
});

console.log("==========================================");
console.log("Total Raw Rows Count:", rows.length);
console.log("Total All Items Quantity (Including Empty Bottles/Caps):", totalAllQty);
console.log("------------------------------------------");
console.log("FILTERED REAL OIL SALES ONLY:");
console.log("Total Pure Oil Quantity (KG/LT):", totalOilQty);
console.log("Total Pure Oil Revenue (TL):", totalOilRevenue);
console.log("Filtered Oil Items Count:", oilItems.length);
console.log("==========================================");
console.log("Sample Top 15 Oil Items:", oilItems.slice(0, 15));
