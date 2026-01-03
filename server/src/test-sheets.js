import dotenv from 'dotenv';
import { getEnhancedSheetsService } from './services/sheetsService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from server root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        console.log('Testing Sheets Service...');

        // 1. Check Env
        if (!process.env.GOOGLE_SHEET_ID) console.error('MISSING GOOGLE_SHEET_ID');
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) console.error('MISSING GOOGLE_SERVICE_ACCOUNT_EMAIL');
        if (!process.env.GOOGLE_PRIVATE_KEY) console.error('MISSING GOOGLE_PRIVATE_KEY');

        const service = getEnhancedSheetsService();
        console.log('Service initialized.');

        // 2. Test Connection
        await service.initialize();
        console.log('Connection successful.');

        // 3. Test getLeads
        console.log('Fetching leads...');
        const leads = await service.getLeads();
        console.log(`Fetched ${leads.length} leads.`);

        // 4. Test getTodayFollowUps
        console.log('Fetching today follow ups...');
        const followups = await service.getTodayFollowUps();
        console.log(`Fetched ${followups.length} follow ups.`);

    } catch (error) {
        console.error('TEST FAILED:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

test();
