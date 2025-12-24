
// Phase 0.3: Master Field Dictionary & Schema Definitions
// Adapted for the Client Side (Vite/React)

// 1. Leads Master
export interface Lead {
    lead_id: string; // YYMMDD-TYPE-RR-OWN-CS
    timestamp: string; // ISO String
    status: 'New' | 'Working' | 'Potential' | 'MQL' | 'SQL' | 'PO Received' | 'PI' | 'Order' | 'Delivered' | 'Closed/Won' | 'Lost';
    phone_number: string;
    client_name: string;
    city: string;
    inquiry_source: 'IndiaMart' | 'Website' | 'Referral' | 'Direct';
    assigned_owner_code: string; // SR, DK, etc.

    // Sync Fields (Read-only in Master, synced from other sheets)
    last_call_date?: string;
    srf_status?: 'Pending' | 'Partial' | 'Complete';
    quote_status?: 'Draft' | 'Sent' | 'Approved';
}

// 2. First Call Data
export interface FirstCallLog {
    lead_id: string;
    call_date: string;
    duration_seconds: number;
    summary_notes: string;
    interest_level: 'High' | 'Medium' | 'Low';
    next_action_date: string;
}

// 3. SRF Data (Structured Requirement Form)
export interface SRFData {
    lead_id: string;
    container_type: 'Reefer' | 'Dry' | 'Insulated';
    size: '20ft' | '40ft' | 'High Cube';
    temperature_spec?: string; // e.g. -25C to +25C
    commodity: string; // e.g. Pharma, Ice Cream
    rental_period: string; // e.g. 3 Months
    destination: string;
    srf_completion_score: number; // 0-100
}

// 5. Quotation
export interface Quotation {
    quote_id: string;
    lead_id: string;
    generated_date: string;
    total_amount: number;
    pdf_link: string;
    status: 'Draft' | 'Sent' | 'Negotiating' | 'Approved';
}

// Metadata / Constants
export const REGION_CODES = {
    DELHI: 'DL',
    MUMBAI: 'MU',
    UNDEFINED: 'NA'
} as const;

export const OWNER_CODES = {
    SHRUTI: 'SR',
    DHIKSHA: 'DK',
    JAWAD: 'JD',
    ARZAAN: 'AZ'
} as const;
