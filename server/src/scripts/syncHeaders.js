import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

// Complete list of required headers for Leads Master
const REQUIRED_HEADERS = [
    'Lead_ID',
    'Enquiry_Code',
    'Created_At',
    'Updated_At',
    'Date',
    'Lead_Owner',
    'Lead_Source',
    'Client_Company_Name',
    'Client_Person_Name',
    'Client_Number',
    'Client_Mail_ID',
    'Industry',
    'Product',
    'Size',
    'Quantity',
    'Location',
    'Status',
    'MQL_Status',
    'SQL_Date',
    'PO_Date',
    'Lost_Date',
    'Lost_Reason',
    'Remarks',
    'Expected_Closure',
    'Client_Budget_Lead_Value',
    'Sales_Owner',
    'Follow_Up_Date',
    'Follow_Up_Remarks',
    'Follow_Up_1_Date',
    'Follow_Up_1_Notes',
    'Follow_Up_2_Date',
    'Follow_Up_2_Notes',
    'Follow_Up_3_Date',
    'Follow_Up_3_Notes',
    'Follow_Up_4_Date',
    'Follow_Up_4_Notes',
    'Follow_Up_5_Date',
    'Follow_Up_5_Notes',
    'SRF_Completion_Pct',
    'SRF_PDF_Link',
    'Quotation_Link',
    'PI_Link',
    'PO_Number',
    'PO_Value',
    'Order_Number',
    'Is_Returning_Customer',
    'Previous_Lead_IDs'
];

async function syncHeaders() {
    console.log('🔧 Syncing Leads Master headers with required schema...\n');

    try {
        // Validate environment
        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error('Missing Google Sheets credentials');
        }

        // Auth
        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: SCOPES,
        });

        // Load spreadsheet
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
        await doc.loadInfo();
        console.log(`📄 Spreadsheet: ${doc.title}`);

        // Get Leads Master sheet
        const sheet = doc.sheetsByTitle['Leads Master'];
        if (!sheet) {
            throw new Error('Leads Master sheet not found');
        }

        console.log(`📋 Sheet: ${sheet.title}`);
        console.log(`   Size: ${sheet.columnCount} cols x ${sheet.rowCount} rows`);

        // Load current headers
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        console.log(`   Current headers: ${currentHeaders.length}`);

        // Find missing headers
        const missingHeaders = REQUIRED_HEADERS.filter(h => !currentHeaders.includes(h));

        if (missingHeaders.length === 0) {
            console.log('\n✅ All headers present! No changes needed.');
            return;
        }

        console.log(`\n📝 Missing headers (${missingHeaders.length}):`);
        missingHeaders.forEach(h => console.log(`   - ${h}`));

        // Resize if needed
        const requiredColumns = Math.max(REQUIRED_HEADERS.length, currentHeaders.length + missingHeaders.length);
        if (sheet.columnCount < requiredColumns) {
            console.log(`\n📏 Resizing sheet to ${requiredColumns} columns...`);
            await sheet.resize({ columnCount: requiredColumns });
            console.log('✅ Resized');
        }

        // Merge headers (keep existing, add missing at end)
        const finalHeaders = [...currentHeaders];
        for (const header of REQUIRED_HEADERS) {
            if (!finalHeaders.includes(header)) {
                finalHeaders.push(header);
            }
        }

        console.log(`\n📝 Updating headers...`);
        await sheet.setHeaderRow(finalHeaders);

        console.log(`✅ Headers synced!`);
        console.log(`📊 Total columns: ${finalHeaders.length}`);
        console.log('\n✨ Sheet is ready!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
}

syncHeaders()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
