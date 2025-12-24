import xlsx from 'xlsx';
import path from 'path';

// Read the Excel file
const filePath = path.resolve('C:/Users/msi user/Desktop/Developer/Sales/Sales/Calling data.xlsx');
const workbook = xlsx.readFile(filePath);

console.log("=== EXCEL FILE ANALYSIS ===");
console.log("Sheet Names:", workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
        console.log("Headers (Row 1):", data[0]);
        console.log("Total Rows:", data.length);
        console.log("Sample Row 2:", data[1]);
        if (data.length > 2) {
            console.log("Sample Row 3:", data[2]);
        }
    }
});
