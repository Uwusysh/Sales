import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

// Placeholder for Service Account setup
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export class SheetsService {
  constructor(config) {
    this.jwt = new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(config.spreadsheetId, this.jwt);
  }

  async initialize() {
    await this.doc.loadInfo();
    return this.doc;
  }

  // Phase 0.5: Access specific sheets

  async getSheetByTitle(title) {
    await this.initialize();
    const sheet = this.doc.sheetsByTitle[title];
    if (!sheet) {
      throw new Error(`Sheet with title '${title}' not found. Please run foundation setup.`);
    }
    return sheet;
  }

  async getLeadsSheet() {
    return this.getSheetByTitle('Leads Master');
  }

  async getSRFSheet() {
    return this.getSheetByTitle('SRF DB');
  }
}

// Singleton instance helper
export const getSheetsService = () => {
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.warn("Missing Google Sheets credentials in environment variables.");
    // Return a dummy object or throw depending on strictness. 
    // Throwing is better to catch config errors early.
    throw new Error("Missing Google Sheets credentials");
  }

  return new SheetsService({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  });
};
