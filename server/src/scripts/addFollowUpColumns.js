import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

async function addColumns() {
    console.log('🔧 Adding follow-up columns to Google Sheet...\n');

    try {
        // Validate environment variables
        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error('Missing Google Sheets credentials in .env file');
        }

        // Initialize auth
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: SCOPES,
        });

        // Load the spreadsheet
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log(`📄 Loaded spreadsheet: ${doc.title}`);

        // Get the Leads Master sheet
        const sheet = doc.sheetsByTitle['Leads Master'];
        if (!sheet) {
            throw new Error('Leads Master sheet not found');
        }

        console.log(`📋 Working with sheet: ${sheet.title}`);
        console.log(`   Current size: ${sheet.columnCount} columns x ${sheet.rowCount} rows`);

        // Load headers
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        console.log(`   Current headers: ${currentHeaders.length}`);

        // Check if columns already exist
        if (currentHeaders.includes('Follow_Up_1_Date')) {
            console.log('\n✅ Follow-up columns already exist!');
            return;
        }

        // Calculate how many columns we need
        const newColumns = [
            'Follow_Up_1_Date', 'Follow_Up_1_Notes',
            'Follow_Up_2_Date', 'Follow_Up_2_Notes',
            'Follow_Up_3_Date', 'Follow_Up_3_Notes',
            'Follow_Up_4_Date', 'Follow_Up_4_Notes',
            'Follow_Up_5_Date', 'Follow_Up_5_Notes'
        ];

        const requiredColumns = currentHeaders.length + newColumns.length;

        // Resize sheet if needed
        if (sheet.columnCount < requiredColumns) {
            console.log(`\n📏 Resizing sheet from ${sheet.columnCount} to ${requiredColumns} columns...`);
            await sheet.resize({ columnCount: requiredColumns });
            console.log('✅ Sheet resized');
        }

        // Find insert position (after Follow_Up_Remarks)
        const remarksIndex = currentHeaders.indexOf('Follow_Up_Remarks');
        const insertAt = remarksIndex >= 0 ? remarksIndex + 1 : currentHeaders.length;

        // Build new header row
        const newHeaders = [
            ...currentHeaders.slice(0, insertAt),
            ...newColumns,
            ...currentHeaders.slice(insertAt)
        ];

        console.log(`\n📝 Adding columns at position ${insertAt}...`);
        await sheet.setHeaderRow(newHeaders);

        console.log(`✅ Successfully added ${newColumns.length} columns!`);
        console.log(`📊 Total columns: ${newHeaders.length}`);
        console.log('\n✨ Follow-up timeline columns are ready!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

addColumns()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
