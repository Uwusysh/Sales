import { getSheetsService } from '../services/sheetsService.js';
import dotenv from 'dotenv';
dotenv.config();

const SCHEMA = {
    'Leads Master': [
        'Lead_ID', 'Timestamp', 'Status', 'Phone_Number', 'Client_Name',
        'City', 'Inquiry_Source', 'Assigned_Owner_Code',
        'Last_Call_Date', 'SRF_Status', 'Quote_Status'
    ],
    'First Call Data': [
        'Lead_ID', 'Call_Date', 'Duration', 'Summary_Notes', 'Interest_Level', 'Next_Action_Date'
    ],
    'SRF DB': [
        'Lead_ID', 'Container_Type', 'Size', 'Temperature_Spec', 'Commodity',
        'Rental_Period', 'Destination', 'SRF_Completion_Score'
    ],
    'Daily Follow-up DB': [
        'Followup_ID', 'Lead_ID', 'Scheduled_Date', 'Priority', 'Outcome', 'Next_Step'
    ],
    'Quotation Tracker': [
        'Quote_ID', 'Lead_ID', 'Generated_Date', 'Total_Amount', 'PDF_Link', 'Status'
    ],
    'Order Punch DB': [
        'Order_ID', 'Lead_ID', 'Quote_ID', 'Final_Price', 'Payment_Terms', 'Billing_Address'
    ],
    'PI Approval Tracker': [
        'PI_ID', 'Order_ID', 'Created_By', 'Manager_Approval', 'Accounts_Approval', 'PI_Sent_Date'
    ]
};

async function setupDatabase() {
    console.log("========================================");
    console.log("Initializing Google Sheets Database...");
    console.log("========================================");
    console.log("Sheet ID:", process.env.GOOGLE_SHEET_ID);

    try {
        const service = getSheetsService();
        console.log("✅ Service initialized");

        const doc = await service.initialize();
        console.log(`✅ Connected to: "${doc.title}"`);

        for (const [title, headers] of Object.entries(SCHEMA)) {
            try {
                let sheet = doc.sheetsByTitle[title];
                if (!sheet) {
                    console.log(`📝 Creating sheet: ${title}...`);
                    sheet = await doc.addSheet({ title, headerValues: headers });
                    console.log(`   ✅ Created: ${title}`);
                } else {
                    console.log(`✅ Sheet exists: ${title}`);
                    // Update headers if sheet exists
                    await sheet.setHeaderRow(headers);
                    console.log(`   ✅ Headers updated for: ${title}`);
                }
            } catch (sheetError) {
                console.error(`❌ Error with sheet "${title}":`, sheetError.message);
            }
        }

        console.log("========================================");
        console.log("✅ DATABASE SETUP COMPLETE!");
        console.log("========================================");
    } catch (error) {
        console.error("❌ SETUP FAILED:", error.message);
        console.error("Full Error:", error);
    }
}

setupDatabase();
