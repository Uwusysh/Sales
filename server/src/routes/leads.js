import express from 'express';
import { getEnhancedSheetsService } from '../services/sheetsService.js';
import leadIdGenerator from '../utils/leadIdGenerator.js';

const router = express.Router();

// Cache reference from service
let leadsCache = {
  data: null,
  lastFetch: 0,
  ttl: 30000
};

/**
 * GET /api/leads
 * Fetch all leads with filters, search, sorting, and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      owner,
      location,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 100,
      offset = 0,
      followUpToday,
      srfIncomplete
    } = req.query;

    const service = getEnhancedSheetsService();
    const now = Date.now();

    // Get leads with caching
    const isStale = !leadsCache.data || (now - leadsCache.lastFetch) > leadsCache.ttl;

    if (isStale) {
      console.log('📥 Fetching fresh leads from Google Sheets...');
      leadsCache.data = await service.getLeads(true);
      leadsCache.lastFetch = now;
      console.log(`✅ Cached ${leadsCache.data.length} leads`);
    }

    let filteredLeads = [...leadsCache.data];

    // Apply filters
    if (status && status !== 'all' && status !== '') {
      const statusLower = status.toLowerCase();
      filteredLeads = filteredLeads.filter(l =>
        String(l.status || '').toLowerCase() === statusLower
      );
    }

    if (owner && owner !== 'all' && owner !== '') {
      const ownerLower = owner.toLowerCase();
      filteredLeads = filteredLeads.filter(l =>
        String(l.lead_owner || '').toLowerCase().includes(ownerLower) ||
        String(l.sales_owner || '').toLowerCase().includes(ownerLower)
      );
    }

    if (location && location !== 'all' && location !== '') {
      const locationLower = location.toLowerCase();
      filteredLeads = filteredLeads.filter(l =>
        String(l.location || '').toLowerCase().includes(locationLower)
      );
    }

    if (search) {
      const searchLower = String(search).toLowerCase();
      filteredLeads = filteredLeads.filter(l => {
        const company = String(l.client_company || '').toLowerCase();
        const person = String(l.client_person || '').toLowerCase();
        const number = String(l.client_number || '').toLowerCase();
        const email = String(l.client_email || '').toLowerCase();
        const code = String(l.enquiry_code || '').toLowerCase();
        const id = String(l.lead_id || '').toLowerCase();
        const loc = String(l.location || '').toLowerCase();
        const prod = String(l.product || '').toLowerCase();
        const rem = String(l.remarks || '').toLowerCase();

        return company.includes(searchLower) ||
          person.includes(searchLower) ||
          number.includes(searchLower) ||
          email.includes(searchLower) ||
          code.includes(searchLower) ||
          id.includes(searchLower) ||
          loc.includes(searchLower) ||
          prod.includes(searchLower) ||
          rem.includes(searchLower);
      });
    }

    // Filter: Today's follow-ups
    if (followUpToday === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filteredLeads = filteredLeads.filter(l => l.follow_up_date === today);
    }

    // Filter: Incomplete SRF
    if (srfIncomplete === 'true') {
      filteredLeads = filteredLeads.filter(l => {
        const pct = parseInt(l.srf_completion_pct) || 0;
        return pct < 100;
      });
    }

    // Sorting
    filteredLeads.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'date':
          valA = a.date || a.created_at || '';
          valB = b.date || b.created_at || '';
          break;
        case 'company':
          valA = a.client_company || '';
          valB = b.client_company || '';
          break;
        case 'status':
          valA = a.status || 'New';
          valB = b.status || 'New';
          break;
        case 'owner':
          valA = a.lead_owner || '';
          valB = b.lead_owner || '';
          break;
        case 'followup':
          valA = a.follow_up_date || '';
          valB = b.follow_up_date || '';
          break;
        case 'value':
          valA = parseFloat(String(a.budget || a.po_value || '0').replace(/[^0-9.-]/g, '')) || 0;
          valB = parseFloat(String(b.budget || b.po_value || '0').replace(/[^0-9.-]/g, '')) || 0;
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        default:
          valA = a.date || '';
          valB = b.date || '';
      }

      const comparison = valA.localeCompare(valB);
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Get status counts for buckets (from all data, not filtered)
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
        cacheAge: now - leadsCache.lastFetch,
        hasMore: Number(offset) + Number(limit) < total
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
    const service = getEnhancedSheetsService();
    const stats = await service.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/followups/today
 * Get today's follow-up tasks
 */
router.get('/followups/today', async (req, res, next) => {
  try {
    const { owner } = req.query;
    const service = getEnhancedSheetsService();
    const followups = await service.getTodayFollowUps();

    // Filter by owner if specified
    const filtered = owner && owner !== 'all'
      ? followups.filter(f => f.sales_owner === owner)
      : followups;

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/followups/overdue
 * Get overdue follow-ups
 */
router.get('/followups/overdue', async (req, res, next) => {
  try {
    const { owner } = req.query;
    const service = getEnhancedSheetsService();
    const followups = await service.getOverdueFollowUps();

    // Filter by owner if specified
    const filtered = owner && owner !== 'all'
      ? followups.filter(f => f.sales_owner === owner)
      : followups;

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/followups/active
 * Get all active follow-ups with enriched lead data
 */
router.get('/followups/active', async (req, res, next) => {
  try {
    const { owner } = req.query;
    const service = getEnhancedSheetsService();
    const followups = await service.getAllActiveFollowUps(owner);

    // Categorize for dashboard
    const today = new Date().toISOString().split('T')[0];
    const categorized = {
      overdue: followups.filter(f => f.is_overdue),
      today: followups.filter(f => f.is_today),
      upcoming: followups.filter(f => !f.is_overdue && !f.is_today),
      all: followups
    };

    res.json({
      success: true,
      data: categorized,
      counts: {
        overdue: categorized.overdue.length,
        today: categorized.today.length,
        upcoming: categorized.upcoming.length,
        total: followups.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads/followups/complete
 * Mark a follow-up as completed
 */
router.post('/followups/complete', async (req, res, next) => {
  try {
    const { lead_id, follow_up_date, outcome, next_follow_up_date } = req.body;

    if (!lead_id || !follow_up_date) {
      return res.status(400).json({
        success: false,
        error: 'lead_id and follow_up_date are required'
      });
    }

    const service = getEnhancedSheetsService();
    const result = await service.completeFollowUp(
      lead_id,
      follow_up_date,
      outcome,
      next_follow_up_date
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    // Invalidate cache
    leadsCache.data = null;

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/check-duplicate
 * Check for potential duplicates before creating
 */
router.get('/check-duplicate', async (req, res, next) => {
  try {
    const { phone, company } = req.query;

    if (!phone && !company) {
      return res.status(400).json({
        success: false,
        error: 'Phone or company required for duplicate check'
      });
    }

    const service = getEnhancedSheetsService();
    const existingLeads = await service.getLeads();

    const duplicateCheck = leadIdGenerator.detectDuplicate({
      client_number: phone,
      client_company: company
    }, existingLeads);

    res.json({
      success: true,
      data: duplicateCheck
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
    const authenticatedAgent = req.user.agentName;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';
    const service = getEnhancedSheetsService();
    
    console.log(`📋 Fetching lead by ID: "${id}" for user "${authenticatedAgent}"`);
    const lead = await service.getLeadById(id);

    if (!lead) {
      console.log(`❌ Lead not found with ID: "${id}"`);
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // 🔒 SECURITY: Check ownership (admin can view all)
    const leadOwner = String(lead.lead_owner || '').trim().toLowerCase();
    if (!isAdmin && leadOwner !== authenticatedAgent.toLowerCase()) {
      console.warn(`🚫 Unauthorized access: ${authenticatedAgent} tried to view ${lead.lead_owner}'s lead`);
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: You can only view your own leads' 
      });
    }

    // Get related data (SRF, Quotations, FollowUps)
    const leadIdForLookup = lead.lead_id || lead.enquiry_code;
    const [quotations, followups] = await Promise.all([
      service.getQuotations(leadIdForLookup),
      service.getFollowUps(leadIdForLookup)
    ]);

    res.json({
      success: true,
      data: {
        ...lead,
        quotations,
        followups
      }
    });
  } catch (error) {
    console.error('❌ Error fetching lead:', error);
    next(error);
  }
});

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/', async (req, res, next) => {
  try {
    const leadData = req.body;

    // Validate required fields
    if (!leadData.client_number && !leadData.client_company) {
      return res.status(400).json({
        success: false,
        error: 'Either phone number or company name is required'
      });
    }

    const service = getEnhancedSheetsService();
    const result = await service.createLead(leadData);

    // If duplicate found, return for user confirmation
    if (result.duplicate) {
      return res.status(409).json(result);
    }

    // Invalidate cache
    leadsCache.data = null;

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating lead:', error);
    next(error);
  }
});

/**
 * POST /api/leads/force-create
 * Create lead even if duplicate detected
 */
router.post('/force-create', async (req, res, next) => {
  try {
    const { leadData, linkToPrevious } = req.body;

    const service = getEnhancedSheetsService();

    // If linking to previous, mark as returning customer
    if (linkToPrevious) {
      leadData.is_returning_customer = true;
      leadData.previous_lead_ids = linkToPrevious;
    }

    // Generate Lead ID with returning customer flag
    const leadId = leadIdGenerator.generateLeadId({
      location: leadData.location,
      source: linkToPrevious ? 'returning' : leadData.lead_source,
      owner: leadData.lead_owner,
      phoneNumber: leadData.client_number
    });

    // Bypass duplicate check and create
    const sheet = await service.getOrCreateSheet('Leads Master');
    const now = new Date().toISOString();

    const newRow = await sheet.addRow({
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
      'Is_Returning_Customer': linkToPrevious ? 'Yes' : 'No',
      'Previous_Lead_IDs': linkToPrevious || ''
    });

    leadsCache.data = null;

    res.status(201).json({
      success: true,
      lead_id: leadId,
      message: 'Lead created successfully'
    });
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

    const service = getEnhancedSheetsService();
    const result = await service.updateLead(id, updates);

    if (!result.success) {
      return res.status(404).json(result);
    }

    // Invalidate cache
    leadsCache.data = null;

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/leads/:id/status
 * Quick status update
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const service = getEnhancedSheetsService();
    const updates = { Status: status };

    // Add date stamps based on status
    const now = new Date().toISOString().split('T')[0];
    if (status === 'SQL') updates.SQL_Date = now;
    if (status === 'PO RCVD') updates.PO_Date = now;
    if (status === 'Lost') {
      updates.Lost_Date = now;
      if (remarks) updates.Lost_Reason = remarks;
    }
    if (remarks) updates.Remarks = remarks;

    const result = await service.updateLead(id, updates);
    leadsCache.data = null;

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads/:id/followup
 * Schedule a follow-up for a lead
 */
router.post('/:id/followup', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { follow_up_date, notes, follow_up_type = 'Call' } = req.body;
    const authenticatedAgent = req.user.agentName;

    const service = getEnhancedSheetsService();
    const lead = await service.getLeadById(id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // 🔒 SECURITY: Verify ownership before creating followup
    const leadOwner = String(lead.lead_owner || lead.sales_owner || '').trim();
    if (leadOwner.toLowerCase() !== authenticatedAgent.toLowerCase()) {
      console.warn(`🚫 Unauthorized followup creation: ${authenticatedAgent} tried to create followup for ${leadOwner}'s lead ${id}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only manage followups for your own leads'
      });
    }

    // Schedule follow-up directly in Leads Master using sequential columns
    const result = await service.scheduleFollowUpInLeads(
      lead.lead_id || lead.enquiry_code,
      follow_up_date,
      notes || '', // Only save notes, not date statements
      follow_up_type
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    leadsCache.data = null;

    res.json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in scheduleFollowUp route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule follow-up: ' + error.message
    });
  }
});

/**
 * POST /api/leads/refresh
 * Force refresh cache
 */
router.post('/refresh', async (req, res) => {
  leadsCache.data = null;
  leadsCache.lastFetch = 0;

  const service = getEnhancedSheetsService();
  service.invalidateCache('all');

  res.json({ success: true, message: 'Cache invalidated' });
});

/**
 * GET /api/leads/sync/status
 * Get sync status for 2-way sync monitoring
 */
router.get('/sync/status', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        cacheAge: Date.now() - leadsCache.lastFetch,
        cacheValid: leadsCache.data !== null,
        recordCount: leadsCache.data?.length || 0,
        lastSync: new Date(leadsCache.lastFetch).toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
