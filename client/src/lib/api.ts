// API Configuration
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

// Auth helper
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// ============ TYPES ============

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Lead {
  id: string;
  lead_id: string;
  enquiry_code: string;
  created_at: string;
  updated_at: string;
  date: string;
  lead_owner: string;
  lead_source: string;
  client_company: string;
  client_person: string;
  client_number: string;
  client_email: string;
  industry: string;
  product: string;
  size: string;
  quantity: string;
  location: string;
  status: string;
  mql_status: string;
  sql_date: string;
  po_date: string;
  lost_date: string;
  lost_reason: string;
  remarks: string;
  expected_closure: string;
  budget: string;
  sales_owner: string;
  follow_up_date: string;
  follow_up_remarks: string;
  srf_completion_pct: string;
  srf_pdf_link: string;
  quotation_link: string;
  pi_link: string;
  po_number: string;
  po_value: string;
  order_number: string;
  is_returning_customer: string;
  previous_lead_ids: string;
  _rowNumber: number;
  quotations?: Quotation[];
  followups?: FollowUp[];
}

export interface Quotation {
  lead_id: string;
  quotation_number: string;
  quotation_date: string;
  client_name: string;
  total_value: string;
  status: string;
}

export interface FollowUp {
  lead_id: string;
  follow_up_date: string;
  follow_up_time: string;
  sales_owner: string;
  client_name: string;
  client_number: string;
  follow_up_type: string;
  priority: string;
  notes: string;
  completed: string;
  // Enriched fields for active follow-ups
  lead_status?: string;
  lead_location?: string;
  lead_product?: string;
  is_today?: boolean;
  is_overdue?: boolean;
  _rowNumber?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  type?: 'phone_match' | 'company_match';
  message?: string;
  existingLeads?: Lead[];
  suggestedAction?: string;
}

export interface LeadsResponse {
  success: boolean;
  data: Lead[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    statusCounts: Record<string, number>;
    cacheAge: number;
    hasMore: boolean;
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalLeads: number;
    myLeads: number;
    statusCounts: Record<string, number>;
    ownerCounts: Record<string, number>;
    locationCounts: Record<string, number>;
    totalPOValue: number;
    todayLeads: number;
    followUpDue: number;
    isAdmin: boolean;
  };
}

export interface SyncStatus {
  cacheAge: number;
  cacheValid: boolean;
  recordCount: number;
  lastSync: string;
}

// ============ FETCH OPTIONS ============

export interface FetchLeadsOptions {
  status?: string;
  owner?: string;
  location?: string;
  search?: string;
  sortBy?: 'date' | 'company' | 'status' | 'owner' | 'followup' | 'value';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  followUpToday?: boolean;
  srfIncomplete?: boolean;
  viewAll?: boolean;
}

// ============ API FUNCTIONS ============

/**
 * Fetch leads with filters, sorting, and pagination
 */
export async function fetchLeads(params?: FetchLeadsOptions): Promise<LeadsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.owner) query.set('owner', params.owner);
  if (params?.location) query.set('location', params.location);
  if (params?.search) query.set('search', params.search);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  if (params?.followUpToday) query.set('followUpToday', 'true');
  if (params?.srfIncomplete) query.set('srfIncomplete', 'true');
  if (params?.viewAll) query.set('viewAll', 'true');

  const response = await fetch(`${API_BASE}/leads?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch leads', response.status);
  }

  return response.json();
}

/**
 * Fetch dashboard statistics
 */
export async function fetchLeadStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/leads/stats`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch stats', response.status);
  }

  return response.json();
}

/**
 * Fetch single lead by ID with related data
 */
export async function fetchLeadById(id: string): Promise<{ success: boolean; data: Lead }> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Lead not found', response.status);
  }

  return response.json();
}

/**
 * Check for duplicate before creating lead
 */
export async function checkDuplicate(phone?: string, company?: string): Promise<{ success: boolean; data: DuplicateCheckResult }> {
  const query = new URLSearchParams();
  if (phone) query.set('phone', phone);
  if (company) query.set('company', company);

  const response = await fetch(`${API_BASE}/leads/check-duplicate?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Duplicate check failed', response.status);
  }

  return response.json();
}

/**
 * Create a new lead
 */
export async function createLead(leadData: Partial<Lead>): Promise<{ success: boolean; lead_id?: string; duplicate?: boolean; duplicateInfo?: DuplicateCheckResult }> {
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(leadData)
  });

  const data = await response.json();

  // 409 = duplicate found
  if (response.status === 409) {
    return data;
  }

  if (!response.ok) {
    throw new ApiError(data.error || 'Failed to create lead', response.status);
  }

  return data;
}

/**
 * Force create lead even with duplicates
 */
export async function forceCreateLead(leadData: Partial<Lead>, linkToPrevious?: string): Promise<{ success: boolean; lead_id: string }> {
  const response = await fetch(`${API_BASE}/leads/force-create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ leadData, linkToPrevious })
  });

  if (!response.ok) {
    throw new ApiError('Failed to create lead', response.status);
  }

  return response.json();
}

/**
 * Update lead fields
 */
export async function updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; changedFields?: string[] }> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new ApiError('Failed to update lead', response.status);
  }

  return response.json();
}

/**
 * Quick status update
 */
export async function updateLeadStatus(id: string, status: string, remarks?: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/leads/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, remarks })
  });

  if (!response.ok) {
    throw new ApiError('Failed to update status', response.status);
  }

  return response.json();
}

/**
 * Schedule follow-up for a lead
 */
export async function scheduleFollowUp(leadId: string, followUp: Partial<FollowUp>): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/followup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(followUp)
  });

  if (!response.ok) {
    throw new ApiError('Failed to schedule follow-up', response.status);
  }

  return response.json();
}

/**
 * Get today's follow-ups
 */
export async function fetchTodayFollowUps(owner?: string): Promise<{ success: boolean; data: FollowUp[]; count: number }> {
  const query = new URLSearchParams();
  if (owner) query.set('owner', owner);

  const response = await fetch(`${API_BASE}/leads/followups/today?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch follow-ups', response.status);
  }

  return response.json();
}

/**
 * Get overdue follow-ups
 */
export async function fetchOverdueFollowUps(owner?: string): Promise<{ success: boolean; data: FollowUp[]; count: number }> {
  const query = new URLSearchParams();
  if (owner) query.set('owner', owner);

  const response = await fetch(`${API_BASE}/leads/followups/overdue?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch overdue follow-ups', response.status);
  }

  return response.json();
}

/**
 * Get all active follow-ups with categorization
 */
export async function fetchActiveFollowUps(owner?: string): Promise<{
  success: boolean;
  data: {
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    all: FollowUp[];
  };
  counts: {
    overdue: number;
    today: number;
    upcoming: number;
    total: number;
  };
}> {
  const query = new URLSearchParams();
  if (owner) query.set('owner', owner);

  const response = await fetch(`${API_BASE}/leads/followups/active?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch active follow-ups', response.status);
  }

  return response.json();
}

/**
 * Mark a follow-up as completed
 */
export async function completeFollowUp(
  leadId: string,
  followUpDate: string,
  outcome?: string,
  nextFollowUpDate?: string,
  nextFollowUpType?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/leads/followups/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      lead_id: leadId,
      follow_up_date: followUpDate,
      outcome,
      next_follow_up_date: nextFollowUpDate,
      next_follow_up_type: nextFollowUpType
    })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new ApiError(data.error || 'Failed to complete follow-up', response.status);
  }

  return response.json();
}

/**
 * Force refresh cache
 */
export async function refreshLeadsCache(): Promise<void> {
  await fetch(`${API_BASE}/leads/refresh`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{ success: boolean; data: SyncStatus }> {
  const response = await fetch(`${API_BASE}/leads/sync/status`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new ApiError('Failed to get sync status', response.status);
  }

  return response.json();
}

// ============ UTILITY FUNCTIONS ============

/**
 * Format currency in Indian format
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return '₹0';

  // Indian number format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format large numbers with L/Cr suffix
 */
export function formatValue(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return '₹0';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}K`;
  }
  return `₹${num.toFixed(0)}`;
}

/**
 * Parse Lead ID to get components
 */
export function parseLeadId(leadId: string): { region: string; type: string; owner: string; date: string } | null {
  if (!leadId) return null;
  const parts = leadId.split('-');
  if (parts.length !== 6) return null;

  return {
    region: parts[0],
    type: parts[1],
    owner: parts[2],
    date: parts[3]
  };
}

/**
 * Get relative time string
 */
export function getRelativeTime(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
