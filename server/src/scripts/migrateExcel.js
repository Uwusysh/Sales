import xlsx from 'xlsx';
import path from 'path';
import { getSheetsService } from '../services/sheetsService.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the Excel file
const filePath = path.resolve('C:/Users/msi user/Desktop/Developer/Sales/Sales/Calling data.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet);

console.log("=== MIGRATION SCRIPT (Rate Limited) ===");
console.log(`Found ${rawData.length} rows to migrate`);

// Column mapping from Excel to our schema
function mapRowToLead(row) {
    // Parse date from Excel (Excel stores dates as numbers)
    let dateStr = '';
    if (row['Date']) {
        try {
            const excelDate = row['Date'];
            if (typeof excelDate === 'number') {
                const date = new Date((excelDate - 25569) * 86400 * 1000);
                dateStr = date.toISOString().split('T')[0];
            } else {
                dateStr = String(excelDate);
            }
        } catch (e) {
            dateStr = '';
        }
    }

    return {
        Lead_ID: row['Enquiry Code'] || '',
        Timestamp: dateStr,
        Status: row['Status'] || 'New',
        Phone_Number: row['Client_Number'] ? String(row['Client_Number']) : '',
        Client_Name: row['Client_Company_Name'] || row['Client_Person_Name'] || '',
        City: row['Location'] || '',
        Inquiry_Source: row['Lead_Source'] || '',
        Assigned_Owner_Code: row['Lead_Owner'] || '',
        Last_Call_Date: '',
        SRF_Status: row['SRF_MQL_Date'] ? 'Received' : 'Pending',
        Quote_Status: row['SQL_Date'] ? 'Sent' : 'Pending'
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

        // Get existing row count to skip already migrated rows
        await leadsSheet.loadHeaderRow();
        const existingRows = await leadsSheet.getRows();
        const startFrom = existingRows.length;

        console.log(`✅ Connected. Existing rows: ${startFrom}`);
        console.log("📤 Starting data migration...");

        const mappedRows = rawData.map(row => mapRowToLead(row));
        const validRows = mappedRows.filter(row => row.Client_Name || row.Phone_Number);

        // Skip already migrated rows
        const rowsToMigrate = validRows.slice(startFrom);
        console.log(`Remaining rows to migrate: ${rowsToMigrate.length}`);

        if (rowsToMigrate.length === 0) {
            console.log("✅ All data already migrated!");
            return;
        }

        // Add rows in smaller batches with delays
        const batchSize = 25;
        const delayBetweenBatches = 2000; // 2 seconds

        for (let i = 0; i < rowsToMigrate.length; i += batchSize) {
            const batch = rowsToMigrate.slice(i, i + batchSize);
            try {
                await leadsSheet.addRows(batch);
                const progress = Math.min(startFrom + i + batchSize, startFrom + rowsToMigrate.length);
                console.log(`   ✅ Progress: ${progress} / ${validRows.length} total`);

                // Rate limit delay
                if (i + batchSize < rowsToMigrate.length) {
                    await sleep(delayBetweenBatches);
                }
            } catch (err) {
                console.error(`   ❌ Batch failed at row ${i}:`, err.message);
                console.log("   ⏳ Waiting 10s before retry...");
                await sleep(10000);
                // Retry once
                try {
                    await leadsSheet.addRows(batch);
                    console.log(`   ✅ Retry successful`);
                } catch (retryErr) {
                    console.error(`   ❌ Retry also failed. Stopping.`);
                    break;
                }
            }
        }

        console.log("========================================");
        console.log(`✅ MIGRATION COMPLETE!`);
        console.log("========================================");

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    }
}

migrateData();
