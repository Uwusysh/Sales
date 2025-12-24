import express from 'express';
import { getSheetsService } from '../services/sheetsService.js';

const router = express.Router();

// Cache for leads data
let leadsCache = {
  data: null,
  lastFetch: 0,
  ttl: 30000 // 30 seconds cache
};

/**
 * GET /api/leads
 * Fetch all leads with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, owner, search, limit = 100, offset = 0 } = req.query;

    // Check cache
    const now = Date.now();
    if (!leadsCache.data || (now - leadsCache.lastFetch) > leadsCache.ttl) {
      console.log('📥 Fetching fresh leads from Google Sheets...');
      const service = getSheetsService();
      const sheet = await service.getLeadsSheet();
      const rows = await sheet.getRows();

      leadsCache.data = rows.map(row => ({
        id: row.get('Enquiry_Code') || row.rowNumber,
        enquiry_code: row.get('Enquiry_Code'),
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
        location: row.get('Location'),
        status: row.get('Status') || 'New',
        mql_status: row.get('MQL_Status'),
        sql_date: row.get('SQL_Date'),
        po_date: row.get('PO_Date'),
        lost_date: row.get('Lost_Date'),
        remarks: row.get('Remarks'),
        quantity: row.get('Quantity'),
        expected_closure: row.get('Expected_Closure'),
        budget: row.get('Client_Budget_Lead_Value'),
        sales_owner: row.get('Sales_Owner'),
        follow_up_date: row.get('Follow_Up_Date'),
        follow_up_remarks: row.get('Follow_Up_Remarks'),
        srf_pdf_link: row.get('SRF_PDF_Link'),
        quotation_link: row.get('Quotation_Link'),
        po_number: row.get('PO_Number'),
        po_value: row.get('PO_Value'),
        order_number: row.get('Order_Number'),
        _rowNumber: row.rowNumber
      }));
      leadsCache.lastFetch = now;
      console.log(`✅ Cached ${leadsCache.data.length} leads`);
    }

    let filteredLeads = [...leadsCache.data];

    // Apply filters
    if (status && status !== 'all') {
      filteredLeads = filteredLeads.filter(l =>
        l.status?.toLowerCase().includes(status.toLowerCase())
      );
    }
    if (owner) {
      filteredLeads = filteredLeads.filter(l =>
        l.lead_owner?.toLowerCase().includes(owner.toLowerCase())
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(l =>
        l.client_company?.toLowerCase().includes(searchLower) ||
        l.client_person?.toLowerCase().includes(searchLower) ||
        l.client_number?.includes(search) ||
        l.enquiry_code?.toLowerCase().includes(searchLower) ||
        l.location?.toLowerCase().includes(searchLower)
      );
    }

    // Get status counts for buckets
    const statusCounts = {};
    leadsCache.data.forEach(l => {
      const s = l.status || 'New';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Pagination
    const total = filteredLeads.length;
    const paginatedLeads = filteredLeads.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: paginatedLeads,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        statusCounts,
        cacheAge: now - leadsCache.lastFetch
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    next(error);
  }
});

/**
 * GET /api/leads/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Ensure cache is fresh
    if (!leadsCache.data) {
      const service = getSheetsService();
      const sheet = await service.getLeadsSheet();
      const rows = await sheet.getRows();
      leadsCache.data = rows.map(row => ({
        status: row.get('Status') || 'New',
        lead_owner: row.get('Lead_Owner'),
        date: row.get('Date'),
        po_value: row.get('PO_Value')
      }));
      leadsCache.lastFetch = Date.now();
    }

    const leads = leadsCache.data;

    // Calculate stats
    const totalLeads = leads.length;
    const statusCounts = {};
    const ownerCounts = {};
    let totalPOValue = 0;

    leads.forEach(l => {
      // Status counts
      const status = l.status || 'New';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Owner counts
      if (l.lead_owner) {
        ownerCounts[l.lead_owner] = (ownerCounts[l.lead_owner] || 0) + 1;
      }

      // PO Value
      if (l.po_value) {
        const val = parseFloat(String(l.po_value).replace(/[^0-9.-]/g, ''));
        if (!isNaN(val)) totalPOValue += val;
      }
    });

    res.json({
      success: true,
      data: {
        totalLeads,
        statusCounts,
        ownerCounts,
        totalPOValue,
        todayLeads: leads.filter(l => {
          const today = new Date().toISOString().split('T')[0];
          return l.date === today;
        }).length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/:id
 * Get single lead details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = getSheetsService();
    const sheet = await service.getLeadsSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('Enquiry_Code') === id);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Get all fields for detailed view
    const lead = {};
    const headers = sheet.headerValues;
    headers.forEach(h => {
      lead[h] = row.get(h);
    });
    lead._rowNumber = row.rowNumber;

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead fields
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = getSheetsService();
    const sheet = await service.getLeadsSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('Enquiry_Code') === id);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      row.set(key, updates[key]);
    });

    await row.save();

    // Invalidate cache
    leadsCache.data = null;

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: updates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads/refresh
 * Force refresh cache
 */
router.post('/refresh', async (req, res) => {
  leadsCache.data = null;
  leadsCache.lastFetch = 0;
  res.json({ success: true, message: 'Cache invalidated' });
});

export default router;
