const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
const window = dom.window;

// Load script files in order
const jsFiles = ['js/productsData.js', 'js/liveSiteData.js', 'js/storage.js', 'js/calculator.js', 'js/app.js'];

jsFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    try {
        window.eval(code);
        console.log(`Loaded ${file} successfully.`);
    } catch (e) {
        console.error(`Error loading ${file}:`, e);
    }
});

// Test switchLayerMode(3)
try {
    window.switchLayerMode(3);
    console.log("switchLayerMode(3) executed.");
    const grid = window.document.getElementById("layer3-product-grid");
    console.log("layer3-product-grid innerHTML length:", grid ? grid.innerHTML.length : "NOT FOUND");
    console.log("Child element count in grid:", grid ? grid.children.length : 0);
} catch (e) {
    console.error("Error running switchLayerMode(3):", e);
}
