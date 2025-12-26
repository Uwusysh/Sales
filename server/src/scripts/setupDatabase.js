/**
 * Database Setup Script
 * Run this once to create the complete Google Sheets structure
 * 
 * Usage: node src/scripts/setupDatabase.js
 */

import dotenv from 'dotenv';
import { getEnhancedSheetsService, SHEET_CONFIG } from '../services/sheetsService.js';

dotenv.config();

async function setupDatabase() {
    console.log('🚀 Starting Google Sheets Database Setup...\n');

    try {
        const service = getEnhancedSheetsService();

        console.log('📊 Creating/Verifying sheets structure...\n');
        const result = await service.setupDatabase();

        console.log('\n✅ Database setup complete!');
        console.log('📋 Created sheets:');
        result.sheets.forEach(sheet => {
            console.log(`   - ${sheet}`);
        });

        console.log('\n📝 Sheet Configuration:');
        for (const [title, config] of Object.entries(SHEET_CONFIG)) {
            console.log(`\n   ${title}:`);
            console.log(`   - Columns: ${config.headers.length}`);
            console.log(`   - Frozen Rows: ${config.frozenRows || 0}`);
            console.log(`   - Frozen Cols: ${config.frozenCols || 0}`);
            if (config.dropdowns) {
                console.log(`   - Dropdowns: ${Object.keys(config.dropdowns).join(', ')}`);
            }
        }

        console.log('\n🎉 Your Sales Dashboard database is ready!');
        console.log('   You can now start using the dashboard.\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);

        if (error.message.includes('credentials')) {
            console.log('\n📌 Check your .env file has:');
            console.log('   - GOOGLE_SHEET_ID');
            console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL');
            console.log('   - GOOGLE_PRIVATE_KEY');
        }

        if (error.message.includes('permission')) {
            console.log('\n📌 Make sure you have shared the spreadsheet with your service account email');
        }

        process.exit(1);
    }
}

setupDatabase();
