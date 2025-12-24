import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('C:/Users/msi user/Desktop/Developer/Sales/Sales/Calling data.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log("=== COMPLETE COLUMN ANALYSIS ===\n");

// Get headers (row 1)
const headers = data[0];
console.log(`Total Columns: ${headers.length}\n`);

console.log("ALL COLUMNS:");
console.log("============");
headers.forEach((header, i) => {
    if (header) {
        // Get sample values from first few rows
        const samples = [];
        for (let row = 1; row <= Math.min(5, data.length - 1); row++) {
            if (data[row] && data[row][i] !== undefined && data[row][i] !== '') {
                samples.push(data[row][i]);
            }
        }
        console.log(`${i + 1}. "${header}"`);
        if (samples.length > 0) {
            console.log(`   Sample: ${samples.slice(0, 2).join(' | ')}`);
        }
    }
});

// Also output as JSON for schema design
console.log("\n\n=== HEADERS AS ARRAY ===");
const cleanHeaders = headers.filter(h => h && h.trim());
console.log(JSON.stringify(cleanHeaders, null, 2));
