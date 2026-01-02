import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import leadIdGenerator from '../utils/leadIdGenerator.js';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

/**
 * Sheet Configuration - Complete Phase 1 Structure
 * 7 Core Tabs as per specification
 */
const SHEET_CONFIG = {
  // Tab 1: Leads Master - Primary CRM data
  'Leads Master': {
    headers: [
      'Lead_ID',           // Universal identifier (new architecture)
      'Enquiry_Code',      // Legacy support
      'Created_At',        // Auto timestamp
      'Updated_At',        // Auto timestamp
      'Date',              // Enquiry date
      'Lead_Owner',        // Sales person
      'Lead_Source',       // IndiaMart, JustDial, Direct, etc.
      'Client_Company_Name',
      'Client_Person_Name',
      'Client_Number',
      'Client_Mail_ID',
      'Industry',
      'Product',
      'Size',
      'Quantity',
      'Location',
      'Status',            // Dropdown: New, Working, Potential, MQL, SQL, Under discussions, PO RCVD, Lost
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
      'SRF_Completion_Pct', // SRF completion percentage
      'SRF_PDF_Link',
      'Quotation_Link',
      'PI_Link',
      'PO_Number',
      'PO_Value',
      'Order_Number',
      'Is_Returning_Customer',
      'Previous_Lead_IDs'
    ],
    frozenCols: 3,
    frozenRows: 1,
    dropdowns: {
      'Status': ['New', 'Working', 'Potential', 'MQL', 'SQL', 'Under discussions', 'PO RCVD', 'Lost', 'Closed'],
      'Lead_Source': ['IndiaMart', 'JustTrade', 'JustDial', 'Website', 'Direct Call', 'Email', 'Referral', 'Exhibition', 'Walk-in', 'Social Media', 'LinkedIn', 'Other'],
      'Industry': ['Manufacturing', 'Pharmaceutical', 'Food & Beverage', 'Chemical', 'Textile', 'Automotive', 'Electronics', 'Construction', 'Agriculture', 'Other']
    }
  },

  // Tab 2: First Call Data - Initial call capture
  'First Call Data': {
    headers: [
      'Lead_ID',
      'Call_Date',
      'Call_Time',
      'Called_By',
      'Client_Number',
      'Client_Name',
      'Company_Name',
      'Call_Duration',
      'Call_Outcome',       // Dropdown
      'Interest_Level',     // Dropdown: Hot, Warm, Cold
      'Product_Discussed',
      'Quantity_Required',
      'Budget_Mentioned',
      'Timeline',
      'Decision_Maker',
      'Next_Steps',
      'Transcript_Link',
      'WhatsApp_Followup_Sent',
      'Remarks',
      'Created_At'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Call_Outcome': ['Connected', 'No Answer', 'Busy', 'Wrong Number', 'Callback Requested', 'DND'],
      'Interest_Level': ['Hot', 'Warm', 'Cold', 'Not Interested']
    }
  },

  // Tab 3: SRF DB - Site Requirement Form Database
  'SRF DB': {
    headers: [
      'Lead_ID',
      'SRF_Number',
      'Created_Date',
      'Updated_Date',
      'Client_Name',
      'Client_Company',
      'Contact_Number',
      'Email',
      'Site_Address',
      'Site_City',
      'Site_State',
      'Product_Type',
      'Capacity_Required',
      'Dimensions_L',
      'Dimensions_W',
      'Dimensions_H',
      'Power_Requirement',
      'Installation_Type',  // Indoor/Outdoor
      'Special_Requirements',
      'Completion_Status',  // Percentage
      'Documents_Attached',
      'Site_Visit_Required',
      'Site_Visit_Date',
      'Assigned_Engineer',
      'SRF_PDF_Link',
      'Remarks',
      'Created_By'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Installation_Type': ['Indoor', 'Outdoor', 'Both', 'TBD'],
      'Completion_Status': ['0%', '25%', '50%', '75%', '100%'],
      'Site_Visit_Required': ['Yes', 'No', 'Pending Decision']
    }
  },

  // Tab 4: Daily Follow-up DB
  'Daily Follow-up DB': {
    headers: [
      'Lead_ID',
      'Follow_Up_Date',
      'Follow_Up_Time',
      'Sales_Owner',
      'Client_Name',
      'Client_Number',
      'Follow_Up_Type',     // Dropdown: Call, WhatsApp, Email, Meeting
      'Status_Before',
      'Status_After',
      'Outcome',
      'Notes',
      'Next_Follow_Up_Date',
      'Priority',           // Dropdown: High, Medium, Low
      'Completed',          // Checkbox
      'Created_At'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Follow_Up_Type': ['Call', 'WhatsApp', 'Email', 'Meeting', 'Site Visit'],
      'Priority': ['High', 'Medium', 'Low'],
      'Completed': ['Yes', 'No']
    }
  },

  // Tab 5: Quotation Tracker
  'Quotation Tracker': {
    headers: [
      'Lead_ID',
      'Quotation_Number',
      'Quotation_Date',
      'Version',            // V1, V2, V3...
      'Client_Name',
      'Client_Company',
      'Product',
      'Quantity',
      'Unit_Price',
      'Total_Value',
      'Discount_Pct',
      'Final_Value',
      'Validity_Days',
      'Expiry_Date',
      'Status',             // Dropdown: Draft, Sent, Under Review, Accepted, Rejected, Expired
      'Sent_Via',           // Email, WhatsApp, Courier
      'Sent_Date',
      'Client_Response',
      'Revision_Needed',
      'Quotation_PDF_Link',
      'Created_By',
      'Approved_By',
      'Remarks',
      'Created_At',
      'Updated_At'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Status': ['Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired', 'Revised'],
      'Sent_Via': ['Email', 'WhatsApp', 'Courier', 'In Person'],
      'Revision_Needed': ['Yes', 'No']
    }
  },

  // Tab 6: Order Punch DB
  'Order Punch DB': {
    headers: [
      'Lead_ID',
      'Order_Number',
      'Order_Date',
      'PO_Number',
      'PO_Date',
      'PO_Value',
      'Client_Name',
      'Client_Company',
      'Product',
      'Quantity',
      'Unit_Price',
      'Order_Value',
      'Advance_Amount',
      'Advance_Received',
      'Balance_Amount',
      'Delivery_Date_Committed',
      'Delivery_Date_Actual',
      'Order_Status',       // Dropdown
      'Production_Status',
      'Dispatch_Status',
      'Invoice_Number',
      'Invoice_Link',
      'E_Way_Bill',
      'Transporter',
      'LR_Number',
      'Sales_Owner',
      'Remarks',
      'Created_At',
      'Updated_At'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Order_Status': ['Confirmed', 'In Production', 'Ready', 'Dispatched', 'Delivered', 'Cancelled', 'On Hold'],
      'Production_Status': ['Not Started', 'In Progress', 'Completed', 'QC Pending', 'QC Passed'],
      'Dispatch_Status': ['Pending', 'Ready to Dispatch', 'Dispatched', 'In Transit', 'Delivered']
    }
  },

  // Tab 7: PI Approval Tracker
  'PI Approval Tracker': {
    headers: [
      'Lead_ID',
      'PI_Number',
      'PI_Date',
      'Quotation_Number',
      'Client_Name',
      'Client_Company',
      'PI_Value',
      'Payment_Terms',
      'Delivery_Terms',
      'Validity',
      'Internal_Approval_Status',  // Pending, Approved, Rejected
      'Internal_Approved_By',
      'Internal_Approval_Date',
      'Client_Approval_Status',    // Pending, Approved, Rejected
      'Client_Approval_Date',
      'PO_Expected_Date',
      'PI_PDF_Link',
      'Client_Signed_Copy',
      'Remarks',
      'Created_By',
      'Created_At',
      'Updated_At'
    ],
    frozenCols: 2,
    frozenRows: 1,
    dropdowns: {
      'Internal_Approval_Status': ['Pending', 'Approved', 'Rejected', 'Revision Required'],
      'Client_Approval_Status': ['Sent', 'Under Review', 'Approved', 'Rejected', 'Revision Required']
    }
  },

  // Tab 8: Sync Log (for 2-way sync tracking)
  'Sync Log': {
    headers: [
      'Timestamp',
      'Action',        // CREATE, UPDATE, DELETE, SYNC
      'Entity_Type',   // Lead, SRF, Quotation, etc.
      'Lead_ID',
      'Changed_Fields',
      'Old_Values',
      'New_Values',
      'Source',        // Dashboard, Sheet, API
      'User',
      'Status',        // Success, Failed, Conflict
      'Error_Message'
    ],
    frozenCols: 1,
    frozenRows: 1
  }
};

export class EnhancedSheetsService {
  constructor(config) {
    this.jwt = new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(config.spreadsheetId, this.jwt);
    this.initialized = false;

    // Cache configuration
    this.cache = {
      leads: { data: null, lastFetch: 0, ttl: 30000 },
      srf: { data: null, lastFetch: 0, ttl: 60000 },
      followups: { data: null, lastFetch: 0, ttl: 30000 },
      quotations: { data: null, lastFetch: 0, ttl: 60000 },
      orders: { data: null, lastFetch: 0, ttl: 60000 },
      pi: { data: null, lastFetch: 0, ttl: 60000 }
    };

    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };

    // API usage tracking
    this.apiUsage = {
      calls: 0,
      lastReset: Date.now(),
      limit: 100, // per minute (Google Sheets limit is 100/minute)
      windowMs: 60000
    };
  }

  /**
   * Wait with exponential backoff
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with retry logic
   */
  async withRetry(operation, operationName = 'operation') {
    let lastError;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check API rate limit
        await this.checkRateLimit();

        const result = await operation();
        this.apiUsage.calls++;
        return result;
      } catch (error) {
        lastError = error;
        console.error(`❌ ${operationName} failed (attempt ${attempt}/${this.retryConfig.maxRetries}):`, error.message);

        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check and enforce API rate limiting
   */
  async checkRateLimit() {
    const now = Date.now();

    // Reset counter if window passed
    if (now - this.apiUsage.lastReset > this.apiUsage.windowMs) {
      this.apiUsage.calls = 0;
      this.apiUsage.lastReset = now;
    }

    // If at limit, wait for next window
    if (this.apiUsage.calls >= this.apiUsage.limit) {
      const waitTime = this.apiUsage.windowMs - (now - this.apiUsage.lastReset);
      console.log(`⚠️ API rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.apiUsage.calls = 0;
      this.apiUsage.lastReset = Date.now();
    }
  }

  /**
   * Initialize connection to Google Sheets
   */
  async initialize() {
    if (this.initialized) return this.doc;

    await this.withRetry(async () => {
      await this.doc.loadInfo();
    }, 'initialize');

    this.initialized = true;
    console.log(`📊 Connected to spreadsheet: ${this.doc.title}`);
    return this.doc;
  }

  /**
   * Get or create a sheet with proper structure
   */
  async getOrCreateSheet(title) {
    await this.initialize();

    let sheet = this.doc.sheetsByTitle[title];

    if (!sheet && SHEET_CONFIG[title]) {
      console.log(`📝 Creating sheet: ${title}`);
      sheet = await this.withRetry(async () => {
        return await this.doc.addSheet({
          title,
          headerValues: SHEET_CONFIG[title].headers
        });
      }, `create sheet ${title}`);

      // Apply frozen rows/columns
      if (SHEET_CONFIG[title].frozenRows || SHEET_CONFIG[title].frozenCols) {
        await this.withRetry(async () => {
          await sheet.updateProperties({
            gridProperties: {
              frozenRowCount: SHEET_CONFIG[title].frozenRows || 0,
              frozenColumnCount: SHEET_CONFIG[title].frozenCols || 0
            }
          });
        }, `freeze ${title}`);
      }
    }

    return sheet;
  }

  /**
   * Setup all sheets - Run this once to create DB structure
   */
  async setupDatabase() {
    console.log('🚀 Setting up Google Sheets Database...');

    for (const [title, config] of Object.entries(SHEET_CONFIG)) {
      await this.getOrCreateSheet(title);
      console.log(`✅ Sheet ready: ${title}`);
    }

    console.log('🎉 Database setup complete!');
    return { success: true, sheets: Object.keys(SHEET_CONFIG) };
  }

  // ============ LEADS MASTER OPERATIONS ============

  /**
   * Get all leads with caching
   */
  async getLeads(forceRefresh = false) {
    const now = Date.now();
    const cache = this.cache.leads;

    if (!forceRefresh && cache.data && (now - cache.lastFetch) < cache.ttl) {
      return cache.data;
    }

    console.log('📥 Fetching leads from Google Sheets...');

    const sheet = await this.getOrCreateSheet('Leads Master');
    const rows = await this.withRetry(async () => {
      return await sheet.getRows();
    }, 'getLeads');

    cache.data = rows.map(row => this.rowToLeadObject(row));
    cache.lastFetch = now;

    // Initialize Lead ID sequence
    leadIdGenerator.initializeSequence(cache.data.map(l => l.lead_id || l.enquiry_code));

    console.log(`✅ Cached ${cache.data.length} leads`);
    return cache.data;
  }

  /**
   * Convert sheet row to lead object
   */
  rowToLeadObject(row) {
    return {
      id: row.get('Lead_ID') || row.get('Enquiry_Code') || row.rowNumber,
      lead_id: row.get('Lead_ID'),
      enquiry_code: row.get('Enquiry_Code'),
      created_at: row.get('Created_At'),
      updated_at: row.get('Updated_At'),
      date: row.get('Date'),
      lead_owner: row.get('Lead_Owner'),
      lead_source: row.get('Lead_Source'),
      client_company: row.get('Client_Company_Name'),
      client_person: row.get('Client_Person_Name'),
      client_number: row.get('Client_Number'),
      client_email: row.get('Client_Mail_ID'),
      industry: row.get('Industry'),
      product: row.get('Product'),
      size: row.get('Size'),
      quantity: row.get('Quantity'),
      location: row.get('Location'),
      status: row.get('Status') || 'New',
      mql_status: row.get('MQL_Status'),
      sql_date: row.get('SQL_Date'),
      po_date: row.get('PO_Date'),
      lost_date: row.get('Lost_Date'),
      lost_reason: row.get('Lost_Reason'),
      remarks: row.get('Remarks'),
      expected_closure: row.get('Expected_Closure'),
      budget: row.get('Client_Budget_Lead_Value'),
      sales_owner: row.get('Sales_Owner'),
      follow_up_date: row.get('Follow_Up_Date'),
      follow_up_remarks: row.get('Follow_Up_Remarks'),
      srf_completion_pct: row.get('SRF_Completion_Pct'),
      srf_pdf_link: row.get('SRF_PDF_Link'),
      quotation_link: row.get('Quotation_Link'),
      pi_link: row.get('PI_Link'),
      po_number: row.get('PO_Number'),
      po_value: row.get('PO_Value'),
      order_number: row.get('Order_Number'),
      is_returning_customer: row.get('Is_Returning_Customer'),
      previous_lead_ids: row.get('Previous_Lead_IDs'),
      _rowNumber: row.rowNumber
    };
  }

  /**
   * Create a new lead with auto-generated Lead ID
   */
  async createLead(leadData) {
    const existingLeads = await this.getLeads();

    // Check for duplicates
    const duplicateCheck = leadIdGenerator.detectDuplicate(leadData, existingLeads);
    if (duplicateCheck.isDuplicate && duplicateCheck.suggestedAction === 'MERGE_OR_NEW') {
      // Return the duplicate info for user decision
      return {
        success: false,
        duplicate: true,
        duplicateInfo: duplicateCheck,
        message: 'Potential duplicate detected. Please confirm action.'
      };
    }

    // Generate new Lead ID
    const leadId = leadIdGenerator.generateLeadId({
      location: leadData.location,
      source: leadData.lead_source,
      owner: leadData.lead_owner,
      phoneNumber: leadData.client_number
    });

    const now = new Date().toISOString();

    const sheet = await this.getOrCreateSheet('Leads Master');

    const newRow = await this.withRetry(async () => {
      return await sheet.addRow({
        'Lead_ID': leadId,
        'Enquiry_Code': leadData.enquiry_code || leadId,
        'Created_At': now,
        'Updated_At': now,
        'Date': leadData.date || new Date().toISOString().split('T')[0],
        'Lead_Owner': leadData.lead_owner || '',
        'Lead_Source': leadData.lead_source || '',
        'Client_Company_Name': leadData.client_company || '',
        'Client_Person_Name': leadData.client_person || '',
        'Client_Number': leadData.client_number || '',
        'Client_Mail_ID': leadData.client_email || '',
        'Industry': leadData.industry || '',
        'Product': leadData.product || '',
        'Size': leadData.size || '',
        'Quantity': leadData.quantity || '',
        'Location': leadData.location || '',
        'Status': leadData.status || 'New',
        'Remarks': leadData.remarks || '',
        'Expected_Closure': leadData.expected_closure || '',
        'Client_Budget_Lead_Value': leadData.budget || '',
        'Is_Returning_Customer': duplicateCheck.isDuplicate ? 'Yes' : 'No'
      });
    }, 'createLead');

    // Invalidate cache
    this.cache.leads.data = null;

    // Log the sync action
    await this.logSync('CREATE', 'Lead', leadId, null, leadData, 'Dashboard');

    return {
      success: true,
      lead_id: leadId,
      data: this.rowToLeadObject(newRow)
    };
  }

  /**
   * Update a lead
   */
  async updateLead(leadId, updates) {
    const sheet = await this.getOrCreateSheet('Leads Master');
    const rows = await this.withRetry(async () => {
      return await sheet.getRows();
    }, 'updateLead-fetch');

    const row = rows.find(r =>
      r.get('Lead_ID') === leadId ||
      r.get('Enquiry_Code') === leadId
    );

    if (!row) {
      return { success: false, error: 'Lead not found' };
    }

    // Capture old values for sync log
    const oldValues = {};
    const changedFields = [];

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      const sheetKey = this.camelToSnake(key);
      const oldValue = row.get(sheetKey);
      if (oldValue !== value) {
        oldValues[key] = oldValue;
        changedFields.push(key);
        row.set(sheetKey, value);
      }
    });

    // Update timestamp
    row.set('Updated_At', new Date().toISOString());

    await this.withRetry(async () => {
      await row.save();
    }, 'updateLead-save');

    // Invalidate cache
    this.cache.leads.data = null;

    // Log sync
    await this.logSync('UPDATE', 'Lead', leadId, oldValues, updates, 'Dashboard', changedFields);

    return {
      success: true,
      message: 'Lead updated successfully',
      changedFields
    };
  }

  /**
   * Get lead by ID
   * Handles Lead_ID, Enquiry_Code, or row number (as string or number)
   */
  async getLeadById(leadId) {
    const leads = await this.getLeads();
    const searchId = String(leadId);
    return leads.find(l => 
      l.lead_id === searchId || 
      l.enquiry_code === searchId || 
      String(l.id) === searchId ||
      String(l._rowNumber) === searchId
    );
  }

  // ============ SRF OPERATIONS ============

  async getSRFs(forceRefresh = false) {
    const cache = this.cache.srf;
    const now = Date.now();

    if (!forceRefresh && cache.data && (now - cache.lastFetch) < cache.ttl) {
      return cache.data;
    }

    const sheet = await this.getOrCreateSheet('SRF DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getSRFs');

    cache.data = rows.map(row => ({
      lead_id: row.get('Lead_ID'),
      srf_number: row.get('SRF_Number'),
      created_date: row.get('Created_Date'),
      client_name: row.get('Client_Name'),
      client_company: row.get('Client_Company'),
      contact_number: row.get('Contact_Number'),
      product_type: row.get('Product_Type'),
      completion_status: row.get('Completion_Status'),
      srf_pdf_link: row.get('SRF_PDF_Link'),
      _rowNumber: row.rowNumber
    }));
    cache.lastFetch = now;

    return cache.data;
  }

  // ============ FOLLOW-UP OPERATIONS ============

  async getTodayFollowUps() {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getTodayFollowUps');

    const today = new Date().toISOString().split('T')[0];

    return rows
      .filter(row => row.get('Follow_Up_Date') === today && row.get('Completed') !== 'Yes')
      .map(row => ({
        lead_id: row.get('Lead_ID'),
        follow_up_date: row.get('Follow_Up_Date'),
        follow_up_time: row.get('Follow_Up_Time'),
        sales_owner: row.get('Sales_Owner'),
        client_name: row.get('Client_Name'),
        client_number: row.get('Client_Number'),
        follow_up_type: row.get('Follow_Up_Type'),
        priority: row.get('Priority'),
        notes: row.get('Notes'),
        _rowNumber: row.rowNumber
      }));
  }

  async getFollowUps(leadId) {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getFollowUps');

    return rows
      .filter(row => row.get('Lead_ID') === leadId)
      .map(row => ({
        lead_id: row.get('Lead_ID'),
        follow_up_date: row.get('Follow_Up_Date'),
        follow_up_time: row.get('Follow_Up_Time'),
        sales_owner: row.get('Sales_Owner'),
        client_name: row.get('Client_Name'),
        client_number: row.get('Client_Number'),
        follow_up_type: row.get('Follow_Up_Type'),
        priority: row.get('Priority'),
        notes: row.get('Notes'),
        completed: row.get('Completed'),
        created_at: row.get('Created_At'),
        _rowNumber: row.rowNumber
      }))
      .sort((a, b) => new Date(b.follow_up_date) - new Date(a.follow_up_date)); // Sort by date desc
  }

  async createFollowUp(followUpData) {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');

    const newRow = await this.withRetry(async () => {
      return await sheet.addRow({
        'Lead_ID': followUpData.lead_id,
        'Follow_Up_Date': followUpData.follow_up_date,
        'Follow_Up_Time': followUpData.follow_up_time || '',
        'Sales_Owner': followUpData.sales_owner,
        'Client_Name': followUpData.client_name,
        'Client_Number': followUpData.client_number,
        'Follow_Up_Type': followUpData.follow_up_type || 'Call',
        'Priority': followUpData.priority || 'Medium',
        'Notes': followUpData.notes || '',
        'Completed': 'No',
        'Created_At': new Date().toISOString()
      });
    }, 'createFollowUp');

    this.cache.followups.data = null;
    return { success: true, rowNumber: newRow.rowNumber };
  }

  /**
   * Get overdue follow-ups (past due date and not completed)
   */
  async getOverdueFollowUps() {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getOverdueFollowUps');

    const today = new Date().toISOString().split('T')[0];

    return rows
      .filter(row => {
        const followUpDate = row.get('Follow_Up_Date');
        const completed = row.get('Completed');
        return followUpDate && followUpDate < today && completed !== 'Yes';
      })
      .map(row => ({
        lead_id: row.get('Lead_ID'),
        follow_up_date: row.get('Follow_Up_Date'),
        follow_up_time: row.get('Follow_Up_Time'),
        sales_owner: row.get('Sales_Owner'),
        client_name: row.get('Client_Name'),
        client_number: row.get('Client_Number'),
        follow_up_type: row.get('Follow_Up_Type'),
        priority: row.get('Priority'),
        notes: row.get('Notes'),
        completed: row.get('Completed'),
        _rowNumber: row.rowNumber
      }))
      .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date)); // Oldest first
  }

  /**
   * Get all active follow-ups with enriched lead data
   */
  async getAllActiveFollowUps(ownerFilter = null) {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getAllActiveFollowUps');
    const leads = await this.getLeads();

    const today = new Date().toISOString().split('T')[0];

    // Create a map for quick lead lookup
    const leadsMap = new Map();
    leads.forEach(lead => {
      const key = lead.lead_id || lead.enquiry_code;
      if (key) leadsMap.set(key, lead);
    });

    return rows
      .filter(row => row.get('Completed') !== 'Yes')
      .filter(row => !ownerFilter || row.get('Sales_Owner') === ownerFilter)
      .map(row => {
        const leadId = row.get('Lead_ID');
        const lead = leadsMap.get(leadId);
        const followUpDate = row.get('Follow_Up_Date');

        return {
          lead_id: leadId,
          follow_up_date: followUpDate,
          follow_up_time: row.get('Follow_Up_Time'),
          sales_owner: row.get('Sales_Owner'),
          client_name: row.get('Client_Name'),
          client_number: row.get('Client_Number'),
          follow_up_type: row.get('Follow_Up_Type'),
          priority: row.get('Priority'),
          notes: row.get('Notes'),
          completed: row.get('Completed'),
          created_at: row.get('Created_At'),
          _rowNumber: row.rowNumber,
          // Enriched lead data
          lead_status: lead?.status,
          lead_location: lead?.location,
          lead_product: lead?.product,
          // Status flags
          is_today: followUpDate === today,
          is_overdue: followUpDate && followUpDate < today
        };
      })
      .sort((a, b) => {
        // Sort: overdue first, then today, then future
        if (a.is_overdue && !b.is_overdue) return -1;
        if (!a.is_overdue && b.is_overdue) return 1;
        if (a.is_today && !b.is_today) return -1;
        if (!a.is_today && b.is_today) return 1;
        return new Date(a.follow_up_date) - new Date(b.follow_up_date);
      });
  }

  /**
   * Mark a follow-up as completed
   */
  async completeFollowUp(leadId, followUpDate, outcome = '', nextFollowUpDate = null) {
    const sheet = await this.getOrCreateSheet('Daily Follow-up DB');
    const rows = await this.withRetry(async () => sheet.getRows(), 'completeFollowUp-fetch');

    // Find the specific follow-up entry
    const row = rows.find(r =>
      r.get('Lead_ID') === leadId &&
      r.get('Follow_Up_Date') === followUpDate &&
      r.get('Completed') !== 'Yes'
    );

    if (!row) {
      return { success: false, error: 'Follow-up entry not found or already completed' };
    }

    // Mark as completed
    row.set('Completed', 'Yes');
    if (outcome) {
      const existingNotes = row.get('Notes') || '';
      row.set('Notes', existingNotes + '\n[COMPLETED] ' + outcome);
    }
    row.set('Status_After', outcome || 'Completed');

    await this.withRetry(async () => {
      await row.save();
    }, 'completeFollowUp-save');

    // Update lead's follow-up date if next date is provided
    if (nextFollowUpDate) {
      await this.updateLead(leadId, {
        Follow_Up_Date: nextFollowUpDate
      });
    }

    // Invalidate caches
    this.cache.followups.data = null;
    this.cache.leads.data = null;

    return { success: true, message: 'Follow-up marked as completed' };
  }

  // ============ QUOTATION OPERATIONS ============

  async getQuotations(leadId = null) {
    const sheet = await this.getOrCreateSheet('Quotation Tracker');
    const rows = await this.withRetry(async () => sheet.getRows(), 'getQuotations');

    let quotations = rows.map(row => ({
      lead_id: row.get('Lead_ID'),
      quotation_number: row.get('Quotation_Number'),
      quotation_date: row.get('Quotation_Date'),
      client_name: row.get('Client_Name'),
      total_value: row.get('Total_Value'),
      status: row.get('Status'),
      _rowNumber: row.rowNumber
    }));

    if (leadId) {
      quotations = quotations.filter(q => q.lead_id === leadId);
    }

    return quotations;
  }

  // ============ SYNC LOGGING ============

  async logSync(action, entityType, leadId, oldValues, newValues, source, changedFields = []) {
    try {
      const sheet = await this.getOrCreateSheet('Sync Log');
      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'Action': action,
        'Entity_Type': entityType,
        'Lead_ID': leadId,
        'Changed_Fields': changedFields.join(', '),
        'Old_Values': JSON.stringify(oldValues || {}),
        'New_Values': JSON.stringify(newValues || {}),
        'Source': source,
        'Status': 'Success'
      });
    } catch (error) {
      console.error('Failed to log sync:', error.message);
    }
  }

  // ============ STATISTICS ============

  async getStats() {
    const leads = await this.getLeads();

    const statusCounts = {};
    const ownerCounts = {};
    const locationCounts = {};
    let totalPOValue = 0;
    const today = new Date().toISOString().split('T')[0];
    let todayLeads = 0;

    leads.forEach(lead => {
      // Status counts
      const status = lead.status || 'New';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Owner counts
      if (lead.lead_owner) {
        ownerCounts[lead.lead_owner] = (ownerCounts[lead.lead_owner] || 0) + 1;
      }

      // Location counts
      if (lead.location) {
        const loc = lead.location.trim();
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }

      // PO value
      if (lead.po_value) {
        const val = parseFloat(String(lead.po_value).replace(/[^0-9.-]/g, ''));
        if (!isNaN(val)) totalPOValue += val;
      }

      // Today's leads
      if (lead.date === today) todayLeads++;
    });

    return {
      totalLeads: leads.length,
      statusCounts,
      ownerCounts,
      locationCounts,
      totalPOValue,
      todayLeads
    };
  }

  // ============ UTILITY METHODS ============

  camelToSnake(str) {
    // Map common field names to sheet column names
    const mapping = {
      'lead_owner': 'Lead_Owner',
      'lead_source': 'Lead_Source',
      'client_company': 'Client_Company_Name',
      'client_person': 'Client_Person_Name',
      'client_number': 'Client_Number',
      'client_email': 'Client_Mail_ID',
      'status': 'Status',
      'remarks': 'Remarks',
      'follow_up_date': 'Follow_Up_Date',
      'expected_closure': 'Expected_Closure'
    };
    return mapping[str] || str;
  }

  invalidateCache(type = 'all') {
    if (type === 'all') {
      Object.keys(this.cache).forEach(key => {
        this.cache[key].data = null;
      });
    } else if (this.cache[type]) {
      this.cache[type].data = null;
    }
  }
}

// Singleton instance
let serviceInstance = null;

export const getEnhancedSheetsService = () => {
  if (!serviceInstance) {
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error('Missing Google Sheets credentials in environment variables');
    }

    serviceInstance = new EnhancedSheetsService({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    });
  }

  return serviceInstance;
};

// Re-export original service for backward compatibility
export {
  EnhancedSheetsService as SheetsService,
  getEnhancedSheetsService as getSheetsService,
  SHEET_CONFIG
};

export default getEnhancedSheetsService;
