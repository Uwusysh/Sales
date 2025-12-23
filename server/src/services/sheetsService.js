import { google } from 'googleapis';

class SheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        console.warn('⚠️  Google Sheets credentials not configured. Using mock data.');
        this.initialized = false;
        return;
      }

      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      this.initialized = true;
      console.log('✅ Google Sheets API initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets:', error.message);
      this.initialized = false;
    }
  }

  async getLeads(agentName = null) {
    await this.initialize();

    if (!this.initialized || !this.spreadsheetId) {
      // Return mock data if not configured
      return this.getMockLeads(agentName);
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:I' // Adjust range as needed
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return [];
      }

      // First row is headers
      const headers = rows[0];
      const leads = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const lead = {
          rowIndex: i + 1, // Google Sheets is 1-indexed
          leadName: row[0] || '',
          phoneNumber: row[1] || '',
          assignedAgent: row[2] || '',
          followUpDate: row[3] || '',
          followUpTime: row[4] || '',
          followUpMode: row[5] || 'Call',
          completed: row[6] === 'Yes',
          lastUpdated: row[7] || ''
        };

        // Calculate status
        lead.status = this.calculateStatus(lead.followUpDate, lead.completed);

        // Filter by agent if specified
        if (agentName && lead.assignedAgent !== agentName) {
          continue;
        }

        leads.push(lead);
      }

      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error.message);
      throw new Error('Failed to fetch leads from Google Sheets');
    }
  }

  async updateFollowUp(rowIndex, updates) {
    await this.initialize();

    if (!this.initialized || !this.spreadsheetId) {
      console.log('Mock: Updating follow-up for row', rowIndex, updates);
      return { success: true, message: 'Mock update successful' };
    }

    try {
      const values = [];
      const ranges = [];

      // Map updates to columns
      if (updates.followUpDate !== undefined) {
        ranges.push(`D${rowIndex}`);
        values.push([updates.followUpDate]);
      }
      if (updates.followUpTime !== undefined) {
        ranges.push(`E${rowIndex}`);
        values.push([updates.followUpTime]);
      }
      if (updates.followUpMode !== undefined) {
        ranges.push(`F${rowIndex}`);
        values.push([updates.followUpMode]);
      }

      // Update last updated timestamp
      ranges.push(`H${rowIndex}`);
      values.push([new Date().toISOString()]);

      const data = ranges.map((range, index) => ({
        range: `Sheet1!${range}`,
        values: values[index]
      }));

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data
        }
      });

      return { success: true, message: 'Follow-up updated successfully' };
    } catch (error) {
      console.error('Error updating follow-up:', error.message);
      throw new Error('Failed to update follow-up');
    }
  }

  async completeFollowUp(rowIndex, completed = true) {
    await this.initialize();

    if (!this.initialized || !this.spreadsheetId) {
      console.log('Mock: Completing follow-up for row', rowIndex);
      return { success: true, message: 'Mock complete successful' };
    }

    try {
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `Sheet1!G${rowIndex}`,
              values: [[completed ? 'Yes' : 'No']]
            },
            {
              range: `Sheet1!H${rowIndex}`,
              values: [[new Date().toISOString()]]
            }
          ]
        }
      });

      return { success: true, message: 'Follow-up marked as complete' };
    } catch (error) {
      console.error('Error completing follow-up:', error.message);
      throw new Error('Failed to complete follow-up');
    }
  }

  calculateStatus(followUpDate, completed) {
    if (completed) return 'Completed';
    if (!followUpDate) return 'Unknown';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUp = new Date(followUpDate);
    followUp.setHours(0, 0, 0, 0);

    if (followUp.getTime() === today.getTime()) return 'Today';
    if (followUp > today) return 'Upcoming';
    if (followUp < today) return 'Overdue';

    return 'Unknown';
  }

  getMockLeads(agentName = null) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const mockLeads = [
      {
        rowIndex: 2,
        leadName: 'John Doe',
        phoneNumber: '+1234567890',
        assignedAgent: 'Agent Smith',
        followUpDate: formatDate(today),
        followUpTime: '10:00',
        followUpMode: 'Call',
        completed: false,
        lastUpdated: today.toISOString(),
        status: 'Today'
      },
      {
        rowIndex: 3,
        leadName: 'Jane Smith',
        phoneNumber: '+1234567891',
        assignedAgent: 'Agent Smith',
        followUpDate: formatDate(yesterday),
        followUpTime: '14:00',
        followUpMode: 'WhatsApp',
        completed: false,
        lastUpdated: yesterday.toISOString(),
        status: 'Overdue'
      },
      {
        rowIndex: 4,
        leadName: 'Bob Johnson',
        phoneNumber: '+1234567892',
        assignedAgent: 'Agent Jones',
        followUpDate: formatDate(tomorrow),
        followUpTime: '11:30',
        followUpMode: 'Call',
        completed: false,
        lastUpdated: today.toISOString(),
        status: 'Upcoming'
      },
      {
        rowIndex: 5,
        leadName: 'Alice Brown',
        phoneNumber: '+1234567893',
        assignedAgent: 'Agent Smith',
        followUpDate: formatDate(yesterday),
        followUpTime: '09:00',
        followUpMode: 'WhatsApp',
        completed: true,
        lastUpdated: today.toISOString(),
        status: 'Completed'
      }
    ];

    if (agentName) {
      return mockLeads.filter(lead => lead.assignedAgent === agentName);
    }

    return mockLeads;
  }
}

export default new SheetsService();

