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

// Types
export interface Lead {
  id: string;
  enquiry_code: string;
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
  location: string;
  status: string;
  mql_status: string;
  sql_date: string;
  po_date: string;
  lost_date: string;
  remarks: string;
  quantity: string;
  expected_closure: string;
  budget: string;
  sales_owner: string;
  follow_up_date: string;
  follow_up_remarks: string;
  srf_pdf_link: string;
  quotation_link: string;
  po_number: string;
  po_value: string;
  order_number: string;
  _rowNumber: number;
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
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalLeads: number;
    statusCounts: Record<string, number>;
    ownerCounts: Record<string, number>;
    totalPOValue: number;
    todayLeads: number;
  };
}

// API Functions
export async function fetchLeads(params?: {
  status?: string;
  owner?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<LeadsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.owner) query.set('owner', params.owner);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const response = await fetch(`${API_BASE}/leads?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }

  return response.json();
}

export async function fetchLeadStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/leads/stats`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

export async function fetchLeadById(id: string): Promise<{ success: boolean; data: Lead }> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Lead not found');
  }

  return response.json();
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update lead');
  }

  return response.json();
}

export async function refreshLeadsCache(): Promise<void> {
  await fetch(`${API_BASE}/leads/refresh`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
}
