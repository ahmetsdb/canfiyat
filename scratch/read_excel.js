const fs = require('fs');
const path = require('path');

const file1 = 'C:\\Users\\ahmet\\Downloads\\2025_LOGO_EXCEL.xls';
const file2 = 'C:\\Users\\ahmet\\Downloads\\Cansızzade-toplam-Satislar.xlsx';

console.log("Checking file 1:", file1, fs.existsSync(file1));
console.log("Checking file 2:", file2, fs.existsSync(file2));

const content1 = fs.readFileSync(file1, 'utf8');
console.log("File 1 length:", content1.length);
// Extract numbers or text from content1
const matches = content1.match(/<Data[^>]*>([^<]+)<\/Data>/g);
if (matches) {
    console.log("Extracted Data sample:", matches.slice(0, 50).map(m => m.replace(/<[^>]+>/g, '')));
} else {
    console.log("First 500 chars:", content1.substring(0, 500));
}
