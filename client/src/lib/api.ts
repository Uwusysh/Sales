/**
 * API Functions for Lead Management
 *
 * Uses the centralized apiClient for all requests.
 * Token injection and error handling are automatic.
 */

import api, { ApiError } from './apiClient';

// Re-export ApiError for consumers
export { ApiError };

// ============ TYPES ============

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
  // Multiple follow-up columns
  follow_up_1_date: string;
  follow_up_1_notes: string;
  follow_up_2_date: string;
  follow_up_2_notes: string;
  follow_up_3_date: string;
  follow_up_3_notes: string;
  follow_up_4_date: string;
  follow_up_4_notes: string;
  follow_up_5_date: string;
  follow_up_5_notes: string;
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

  return api.get<LeadsResponse>(`/leads?${query.toString()}`);
}

/**
 * Fetch dashboard statistics
 */
export async function fetchLeadStats(): Promise<StatsResponse> {
  return api.get<StatsResponse>('/leads/stats');
}

/**
 * Fetch single lead by ID with related data
 */
export async function fetchLeadById(id: string): Promise<{ success: boolean; data: Lead }> {
  return api.get<{ success: boolean; data: Lead }>(`/leads/${id}`);
}

/**
 * Check for duplicate before creating lead
 */
export async function checkDuplicate(phone?: string, company?: string): Promise<{ success: boolean; data: DuplicateCheckResult }> {
  const query = new URLSearchParams();
  if (phone) query.set('phone', phone);
  if (company) query.set('company', company);

  return api.get<{ success: boolean; data: DuplicateCheckResult }>(`/leads/check-duplicate?${query.toString()}`);
}

/**
 * Create a new lead
 */
export async function createLead(leadData: Partial<Lead>): Promise<{ success: boolean; lead_id?: string; duplicate?: boolean; duplicateInfo?: DuplicateCheckResult }> {
  return api.post<{ success: boolean; lead_id?: string; duplicate?: boolean; duplicateInfo?: DuplicateCheckResult }>('/leads', leadData);
}

/**
 * Force create lead even with duplicates
 */
export async function forceCreateLead(leadData: Partial<Lead>, linkToPrevious?: string): Promise<{ success: boolean; lead_id: string }> {
  return api.post<{ success: boolean; lead_id: string }>('/leads/force-create', { leadData, linkToPrevious });
}

/**
 * Update lead fields
 */
export async function updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; changedFields?: string[] }> {
  return api.patch<{ success: boolean; changedFields?: string[] }>(`/leads/${id}`, updates);
}

/**
 * Quick status update
 */
export async function updateLeadStatus(id: string, status: string, remarks?: string): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>(`/leads/${id}/status`, { status, remarks });
}

/**
 * Schedule follow-up for a lead
 */
export async function scheduleFollowUp(rowNumber: string, followUp: Partial<FollowUp>): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`/leads/${rowNumber}/followup`, followUp);
}

/**
 * Get today's follow-ups
 */
export async function fetchTodayFollowUps(owner?: string): Promise<{ success: boolean; data: FollowUp[]; count: number }> {
  const query = new URLSearchParams();
  if (owner) query.set('owner', owner);

  return api.get<{ success: boolean; data: FollowUp[]; count: number }>(`/leads/followups/today?${query.toString()}`);
}

/**
 * Get overdue follow-ups
 */
export async function fetchOverdueFollowUps(owner?: string): Promise<{ success: boolean; data: FollowUp[]; count: number }> {
  const query = new URLSearchParams();
  if (owner) query.set('owner', owner);

  return api.get<{ success: boolean; data: FollowUp[]; count: number }>(`/leads/followups/overdue?${query.toString()}`);
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

  return api.get(`/leads/followups/active?${query.toString()}`);
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
  return api.post<{ success: boolean; message?: string; error?: string }>('/leads/followups/complete', {
    lead_id: leadId,
    follow_up_date: followUpDate,
    outcome,
    next_follow_up_date: nextFollowUpDate,
    next_follow_up_type: nextFollowUpType
  });
}

/**
 * Force refresh cache
 */
export async function refreshLeadsCache(): Promise<void> {
  await api.post('/leads/refresh');
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{ success: boolean; data: SyncStatus }> {
  return api.get<{ success: boolean; data: SyncStatus }>('/leads/sync/status');
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