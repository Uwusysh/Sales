import xlsx from 'xlsx';
import path from 'path';
import { getSheetsService } from '../services/sheetsService.js';
import dotenv from 'dotenv';
dotenv.config();

const filePath = path.resolve('C:/Users/msi user/Desktop/Developer/Sales/Sales/Calling data.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet);

console.log("=== FULL DATA MIGRATION ===");
console.log(`Found ${rawData.length} rows to migrate`);

// Helper to parse Excel dates
function parseExcelDate(val) {
    if (!val) return '';
    if (typeof val === 'number') {
        try {
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    }
    return String(val);
}

// Map Excel row to our schema (all 63 columns)
function mapRow(row) {
    return {
        Enquiry_Code: row['Enquiry Code'] || '',
        Date: parseExcelDate(row['Date']),
        SRF_MQL_Date: parseExcelDate(row['SRF_MQL_Date']),
        Lead_Owner: row['Lead_Owner'] || '',
        Lead_Source: row['Lead_Source'] || '',
        Client_Company_Name: row['Client_Company_Name'] || '',
        Industry: row['Industry'] || '',
        Client_Person_Name: row['Client_Person_Name'] || '',
        Client_Number: row['Client_Number'] ? String(row['Client_Number']) : '',
        Client_Mail_ID: row['Client_Mail_ID'] || '',
        Product: row['Product'] || '',
        Size: row['Size'] || '',
        Location: row['Location'] || '',
        Status: row['Status'] || '',
        SQL_Date: parseExcelDate(row['SQL_Date']),
        PO_Date: parseExcelDate(row['PO_Date']),
        Lost_Date: parseExcelDate(row['Lost_Date']),
        Remarks: row['Remarks'] || '',
        Requirements_City_Site: row['Requirements_City _Site'] || '',
        Lead_Type: row['Lead_Type'] || '',
        Quantity: row['Quantity'] || '',
        Expected_Closure: parseExcelDate(row['Expected_Closure']),
        Client_Budget_Lead_Value: row['Client_Budget_Lead _Value'] || '',
        Sales_Owner: row['Sales_Owner'] || '',
        Follow_Up_Date: parseExcelDate(row['Follow_Up_Date']),
        Follow_Up_Remarks: row['Follow_Up_Remarks'] || '',
        MQL_Status: row['MQL_Status'] || '',
        Lead_Given_By_Or_To: row['Lead_given_by_or_To'] || '',
        CS: row['CS'] || '',
        Remark: row['Remark'] || '',
        Follow_Up_Date_1: parseExcelDate(row['Follow_Up_Date_1']),
        Remark1: row['Remark1'] || '',
        Follow_Up_Date_2: parseExcelDate(row['Follow_Up_Date_2']),
        Remark2: row['Remark2'] || '',
        Follow_Up_Date_3: parseExcelDate(row['Follow_Up_Date_3']),
        Remark3: row['Remark3'] || '',
        Other_Remarks: row['Other_Remarks'] || '',
        MQL_Follow_Up_Date_1: parseExcelDate(row['MQL_Follow_Up_Date_1']),
        Remarkmql1: row['Remarkmql1'] || '',
        MQL_Follow_Up_Date_2: parseExcelDate(row['MQL_Follow_Up_Date_2']),
        Remarkmql2: row['Remarkmql2'] || '',
        MQL_Follow_Up_Date_3: parseExcelDate(row['MQL_Follow_Up_Date_3']),
        Remarkmql3: row['Remarkmql3'] || '',
        SRF_PDF_Link: row['SRF_PDF_Link'] || '',
        Quotation_Link: row['Quotation_Link'] || '',
        SQL_Follow_Up_Date_1: parseExcelDate(row['SQL_Follow_Up_Date_1']),
        Remarksql1: row['Remarksql1'] || '',
        SQL_Follow_Up_Date_2: parseExcelDate(row['SQL_Follow_Up_Date_2']),
        Remarksql2: row['Remarksql2'] || '',
        SQL_Follow_Up_Date_3: parseExcelDate(row['SQL_Follow_Up_Date_3']),
        Remarksql3: row['Remarksql3'] || '',
        PO_Follow_Up_Date_1: parseExcelDate(row['PO_Follow_Up_Date_1']),
        Remarkpo1: row['Remarkpo1'] || '',
        PO_Follow_Up_Date_2: parseExcelDate(row['PO_Follow_Up_Date_2']),
        Remarkpo2: row['Remarkpo2'] || '',
        PO_Follow_Up_Date_3: parseExcelDate(row['PO_Follow_Up_Date_3']),
        Remarkpo3: row['Remarkpo3'] || '',
        PO_Number: row['PO_Number'] || '',
        PO_Value: row['PO_Value'] || '',
        PO_Quantity: row['PO_Quantity'] || '',
        PO_Link: row['PO_Link'] || '',
        Date_To_Delivery: parseExcelDate(row['Date_To_Delivery']),
        Order_Number: row['Order _Number'] || ''
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateData() {
    try {
        const service = getSheetsService();
        const doc = await service.initialize();
        const leadsSheet = doc.sheetsByTitle['Leads Master'];

        if (!leadsSheet) {
            console.error("❌ 'Leads Master' sheet not found!");
            return;
        }

        console.log("✅ Connected to Google Sheets");
        console.log("📤 Starting full data migration...");

        const mappedRows = rawData.map(row => mapRow(row));
        const validRows = mappedRows.filter(row => row.Client_Company_Name || row.Client_Person_Name || row.Client_Number);

        console.log(`Valid rows to migrate: ${validRows.length}`);

        // Add rows in batches
        const batchSize = 30;
        const delayBetweenBatches = 1500;

        for (let i = 0; i < validRows.length; i += batchSize) {
            const batch = validRows.slice(i, i + batchSize);
            try {
                await leadsSheet.addRows(batch);
                const progress = Math.min(i + batchSize, validRows.length);
                console.log(`   ✅ Progress: ${progress} / ${validRows.length}`);

                if (i + batchSize < validRows.length) {
                    await sleep(delayBetweenBatches);
                }
            } catch (err) {
                console.error(`   ❌ Batch failed at row ${i}:`, err.message);
                await sleep(5000);
                try {
                    await leadsSheet.addRows(batch);
                    console.log(`   ✅ Retry successful`);
                } catch (retryErr) {
                    console.error(`   ❌ Retry also failed. Continuing...`);
                }
            }
        }

        console.log("========================================");
        console.log(`✅ MIGRATION COMPLETE! ${validRows.length} leads imported.`);
        console.log("========================================");

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    }
}

migrateData();
