const fs = require('fs');

const jsText = fs.readFileSync('js/productsData.js', 'utf8');
const pMatches = jsText.matchAll(/\{ id: "([^"]+)", sku: "([^"]+)", name: "([^"]+)"/g);

console.log("=== ALL INITIAL PRODUCTS IN JS ===");
for (const m of pMatches) {
  console.log(`${m[1]} | ${m[2]} | ${m[3]}`);
}
