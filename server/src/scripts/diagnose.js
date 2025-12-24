
import { getSheetsService } from '../services/sheetsService.js';
import dotenv from 'dotenv';
dotenv.config();

async function diagnose() {
    console.log("🔍 STARTING DEEP DIAGNOSTIC...");

    try {
        const service = getSheetsService();
        console.log("1. Service Init: OK");

        const doc = await service.initialize();
        console.log(`2. Spreadsheet Connected: "${doc.title}"`);
        console.log(`   (ID: ${process.env.GOOGLE_SHEET_ID})`);

        const sheetCount = Object.keys(doc.sheetsByTitle).length;
        console.log(`3. Existing Sheets Count: ${sheetCount}`);
        console.log(`   Sheets: ${Object.keys(doc.sheetsByTitle).join(', ')}`);

        // Test Write Permission by trying to add a sheet
        const testSheetTitle = `Test_Sheet_${Date.now()}`;
        console.log(`4. Permission Test: Attempting to create sheet "${testSheetTitle}"...`);

        try {
            const newSheet = await doc.addSheet({ title: testSheetTitle });
            console.log("   ✅ SUCCESS: Service Account has WRITE permissions.");

            await newSheet.delete();
            console.log("   ✅ SUCCESS: Deleted test sheet.");

            // If we are here, we can run the setup logic
            console.log("🚀 CONCLUSION: Credentials are valid and have Editor access.");
            console.log("   ACTION: Running Setup Script manually now...");

            // verify setup script logic here essentially
            await runSetupLogic(doc);

        } catch (e) {
            console.error("   ❌ FAILURE: Could not create sheet.");
            console.error("   ❌ ERROR MESSAGE:", e.message);
            console.log("\n🛑 ROOT CAUSE: The Service Account does not have 'Editor' permissions.");
            console.log("   Please Share the Sheet with: " + process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
        }

    } catch (error) {
        console.error("❌ FATAL ERROR:", error.message);
    }
}

async function runSetupLogic(doc) {
    const SCHEMA = {
        'Leads Master': ['Lead_ID', 'Timestamp', 'Status', 'Phone_Number', 'Client_Name', 'City', 'Inquiry_Source', 'Assigned_Owner_Code', 'Last_Call_Date', 'SRF_Status', 'Quote_Status'],
        'First Call Data': ['Lead_ID', 'Call_Date', 'Duration', 'Summary_Notes', 'Interest_Level', 'Next_Action_Date'],
        'SRF DB': ['Lead_ID', 'Container_Type', 'Size', 'Temperature_Spec', 'Commodity', 'Rental_Period', 'Destination', 'SRF_Completion_Score'],
        'Daily Follow-up DB': ['Followup_ID', 'Lead_ID', 'Scheduled_Date', 'Priority', 'Outcome', 'Next_Step'],
        'Quotation Tracker': ['Quote_ID', 'Lead_ID', 'Generated_Date', 'Total_Amount', 'PDF_Link', 'Status'],
        'Order Punch DB': ['Order_ID', 'Lead_ID', 'Quote_ID', 'Final_Price', 'Payment_Terms', 'Billing_Address'],
        'PI Approval Tracker': ['PI_ID', 'Order_ID', 'Created_By', 'Manager_Approval', 'Accounts_Approval', 'PI_Sent_Date']
    };

    console.log("   Running Schema Setup...");
    for (const [title, headers] of Object.entries(SCHEMA)) {
        let sheet = doc.sheetsByTitle[title];
        if (!sheet) {
            process.stdout.write(`   [+] Creating ${title}... `);
            sheet = await doc.addSheet({ title });
            console.log("Done");
        } else {
            console.log(`   [.] Found ${title}`);
        }
        await sheet.loadHeaderRow();
        await sheet.setHeaderRow(headers);
    }
    console.log("✅ SETUP COMPLETE via Diagnostic Tool");
}

diagnose();
