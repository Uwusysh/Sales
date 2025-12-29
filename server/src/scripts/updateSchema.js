import { getSheetsService } from '../services/sheetsService.js';
import dotenv from 'dotenv';
dotenv.config();

// Complete schema matching the Excel file exactly
const FULL_SCHEMA = {
    'Leads Master': [
        'Enquiry_Code',
        'Date',
        'SRF_MQL_Date',
        'Lead_Owner',
        'Lead_Source',
        'Client_Company_Name',
        'Industry',
        'Client_Person_Name',
        'Client_Number',
        'Client_Mail_ID',
        'Product',
        'Size',
        'Location',
        'Status',
        'SQL_Date',
        'PO_Date',
        'Lost_Date',
        'Remarks',
        'Requirements_City_Site',
        'Lead_Type',
        'Quantity',
        'Expected_Closure',
        'Client_Budget_Lead_Value',
        'Sales_Owner',
        'Follow_Up_Date',
        'Follow_Up_Remarks',
        'MQL_Status',
        'Lead_Given_By_Or_To',
        'CS',
        'Remark',
        'Follow_Up_Date_1',
        'Remark1',
        'Follow_Up_Date_2',
        'Remark2',
        'Follow_Up_Date_3',
        'Remark3',
        'Other_Remarks',
        'MQL_Follow_Up_Date_1',
        'Remarkmql1',
        'MQL_Follow_Up_Date_2',
        'Remarkmql2',
        'MQL_Follow_Up_Date_3',
        'Remarkmql3',
        'SRF_PDF_Link',
        'Quotation_Link',
        'SQL_Follow_Up_Date_1',
        'Remarksql1',
        'SQL_Follow_Up_Date_2',
        'Remarksql2',
        'SQL_Follow_Up_Date_3',
        'Remarksql3',
        'PO_Follow_Up_Date_1',
        'Remarkpo1',
        'PO_Follow_Up_Date_2',
        'Remarkpo2',
        'PO_Follow_Up_Date_3',
        'Remarkpo3',
        'PO_Number',
        'PO_Value',
        'PO_Quantity',
        'PO_Link',
        'Date_To_Delivery',
        'Order_Number'
    ],
    'First Call Data': [
        'Enquiry_Code', 'Call_Date', 'Duration', 'Summary_Notes', 'Interest_Level', 'Next_Action_Date'
    ],
    'SRF DB': [
        'Enquiry_Code', 'Product', 'Size', 'Quantity', 'Location', 'Requirements_City_Site', 'SRF_PDF_Link', 'SRF_MQL_Date'
    ],
    'Daily Follow-up DB': [
        'Followup_ID', 'Enquiry_Code', 'Scheduled_Date', 'Follow_Up_Remarks', 'Outcome', 'Next_Step'
    ],
    'Quotation Tracker': [
        'Quote_ID', 'Enquiry_Code', 'SQL_Date', 'Quotation_Link', 'Client_Budget_Lead_Value', 'Status'
    ],
    'Order Punch DB': [
        'Order_Number', 'Enquiry_Code', 'PO_Number', 'PO_Value', 'PO_Quantity', 'PO_Date', 'PO_Link'
    ],
    'PI Approval Tracker': [
        'PI_ID', 'Order_Number', 'Created_By', 'Manager_Approval', 'Accounts_Approval', 'Date_To_Delivery'
    ]
};

async function updateSchema() {
    console.log("=== UPDATING DATABASE SCHEMA ===");

    try {
        const service = getSheetsService();
        const doc = await service.initialize();
        console.log(`Connected to: "${doc.title}"`);

        for (const [title, headers] of Object.entries(FULL_SCHEMA)) {
            let sheet = doc.sheetsByTitle[title];

            if (sheet) {
                console.log(`🗑️  Deleting sheet: ${title}...`);
                await sheet.delete();
            }

            // Create with explicit grid properties for large column count
            console.log(`📝 Creating sheet: ${title} with ${headers.length} columns...`);
            sheet = await doc.addSheet({
                title,
                gridProperties: {
                    rowCount: 15000,
                    columnCount: Math.max(headers.length + 5, 70) // Extra buffer
                }
            });

            // Set headers after creation
            await sheet.setHeaderRow(headers);
            console.log(`   ✅ Created: ${title}`);
        }

        console.log("========================================");
        console.log("✅ SCHEMA UPDATE COMPLETE!");
        console.log("========================================");

    } catch (error) {
        console.error("❌ Schema update failed:", error.message);
        console.error(error);
    }
}

updateSchema();
