/**
 * Lead ID Architecture
 * Format: [REGION]-[INQUIRY_TYPE]-[OWNER_CODE]-[YYMMDD]-[SEQ]-[CHECKSUM]
 * 
 * Example: MH-NE-AS-241224-001-7X
 * 
 * Components:
 * - REGION: 2-letter state/region code (MH=Maharashtra, DL=Delhi, etc.)
 * - INQUIRY_TYPE: 2-letter type (NE=New Enquiry, RE=Returning, RF=Referral, WB=Website, TD=Trade Show)
 * - OWNER_CODE: 2-letter owner initials
 * - YYMMDD: Date stamp
 * - SEQ: 3-digit daily sequence number
 * - CHECKSUM: 2-character collision prevention code
 */

// Region codes mapping (Indian states)
const REGION_CODES = {
    'andhra pradesh': 'AP',
    'arunachal pradesh': 'AR',
    'assam': 'AS',
    'bihar': 'BR',
    'chhattisgarh': 'CG',
    'goa': 'GA',
    'gujarat': 'GJ',
    'haryana': 'HR',
    'himachal pradesh': 'HP',
    'jharkhand': 'JH',
    'karnataka': 'KA',
    'kerala': 'KL',
    'madhya pradesh': 'MP',
    'maharashtra': 'MH',
    'manipur': 'MN',
    'meghalaya': 'ML',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'odisha': 'OD',
    'punjab': 'PB',
    'rajasthan': 'RJ',
    'sikkim': 'SK',
    'tamil nadu': 'TN',
    'telangana': 'TS',
    'tripura': 'TR',
    'uttar pradesh': 'UP',
    'uttarakhand': 'UK',
    'west bengal': 'WB',
    'delhi': 'DL',
    'new delhi': 'DL',
    'mumbai': 'MH',
    'chennai': 'TN',
    'bangalore': 'KA',
    'hyderabad': 'TS',
    'kolkata': 'WB',
    'pune': 'MH',
    'ahmedabad': 'GJ',
    'international': 'IN',
    'unknown': 'XX'
};

// Inquiry type codes
const INQUIRY_TYPE_CODES = {
    'new enquiry': 'NE',
    'new': 'NE',
    'returning customer': 'RE',
    'returning': 'RE',
    'referral': 'RF',
    'website': 'WB',
    'web': 'WB',
    'trade show': 'TD',
    'indiamart': 'IM',
    'justtrade': 'JT',
    'justdial': 'JD',
    'direct call': 'DC',
    'email': 'EM',
    'walk-in': 'WI',
    'social media': 'SM',
    'linkedin': 'LI',
    'exhibition': 'EX',
    'unknown': 'XX'
};

// Counter for daily sequence (in memory, should be persisted for production)
const dailySequence = {
    date: '',
    count: 0
};

/**
 * Get region code from location string
 */
function getRegionCode(location) {
    if (!location) return 'XX';
    const loc = location.toLowerCase().trim();

    // Check for city matches first
    for (const [key, code] of Object.entries(REGION_CODES)) {
        if (loc.includes(key)) return code;
    }

    return 'XX';
}

/**
 * Get inquiry type code
 */
function getInquiryTypeCode(source) {
    if (!source) return 'NE';
    const src = source.toLowerCase().trim();

    for (const [key, code] of Object.entries(INQUIRY_TYPE_CODES)) {
        if (src.includes(key)) return code;
    }

    return 'NE';
}

/**
 * Get owner code from name (first letter of first name + first letter of last name)
 */
function getOwnerCode(ownerName) {
    if (!ownerName) return 'XX';

    const parts = ownerName.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
        return (parts[0][0] + parts[0][1] || 'X').toUpperCase();
    }

    return 'XX';
}

/**
 * Get date stamp in YYMMDD format
 */
function getDateStamp(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

/**
 * Get daily sequence number
 */
function getSequenceNumber(dateStamp) {
    if (dailySequence.date !== dateStamp) {
        dailySequence.date = dateStamp;
        dailySequence.count = 0;
    }
    dailySequence.count++;
    return String(dailySequence.count).padStart(3, '0');
}

/**
 * Generate checksum from ID components for collision prevention
 */
function generateChecksum(idParts) {
    const str = idParts.join('');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // Convert to alphanumeric checksum
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars I,O,0,1
    const num = Math.abs(hash);
    const c1 = chars[num % chars.length];
    const c2 = chars[Math.floor(num / chars.length) % chars.length];

    return `${c1}${c2}`;
}

/**
 * Initialize sequence from existing leads
 * Call this on startup to prevent ID collisions
 */
export function initializeSequence(existingLeadIds) {
    if (!existingLeadIds || existingLeadIds.length === 0) return;

    const today = getDateStamp();
    let maxSeq = 0;

    existingLeadIds.forEach(id => {
        if (!id) return;
        const parts = id.split('-');
        if (parts.length >= 5) {
            const dateInId = parts[3];
            if (dateInId === today) {
                const seq = parseInt(parts[4], 10);
                if (!isNaN(seq) && seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
    });

    dailySequence.date = today;
    dailySequence.count = maxSeq;

    console.log(`📊 Lead ID sequence initialized: ${today} @ ${maxSeq}`);
}

/**
 * Generate a new Lead ID
 * 
 * @param {Object} params - Lead parameters
 * @param {string} params.location - Location/City/State
 * @param {string} params.source - Lead source
 * @param {string} params.owner - Sales owner name
 * @param {Date} params.date - Date (defaults to now)
 * @returns {string} Generated Lead ID
 */
export function generateLeadId({ location, source, owner, date, phoneNumber }) {
    const region = getRegionCode(location);
    const inquiryType = getInquiryTypeCode(source);
    const ownerCode = getOwnerCode(owner);
    const dateStamp = getDateStamp(date);
    const sequence = getSequenceNumber(dateStamp);

    const parts = [region, inquiryType, ownerCode, dateStamp, sequence];
    const checksum = generateChecksum([...parts, phoneNumber || '']);

    return [...parts, checksum].join('-');
}

/**
 * Parse Lead ID back to components
 */
export function parseLeadId(leadId) {
    if (!leadId) return null;

    const parts = leadId.split('-');
    if (parts.length !== 6) return null;

    return {
        region: parts[0],
        inquiryType: parts[1],
        ownerCode: parts[2],
        dateStamp: parts[3],
        sequence: parts[4],
        checksum: parts[5],
        // Derived
        year: `20${parts[3].slice(0, 2)}`,
        month: parts[3].slice(2, 4),
        day: parts[3].slice(4, 6)
    };
}

/**
 * Check if this might be a returning customer based on phone number
 */
export function detectReturningCustomer(phoneNumber, existingLeads) {
    if (!phoneNumber || !existingLeads) return { isReturning: false, existingLeadIds: [] };

    // Normalize phone number
    const normalized = phoneNumber.replace(/\D/g, '').slice(-10);

    const matches = existingLeads.filter(lead => {
        const existingPhone = (lead.client_number || '').replace(/\D/g, '').slice(-10);
        return existingPhone === normalized && existingPhone.length === 10;
    });

    return {
        isReturning: matches.length > 0,
        existingLeadIds: matches.map(m => m.id || m.enquiry_code),
        existingLeads: matches
    };
}

/**
 * Handle duplicate detection and merge suggestion
 */
export function detectDuplicate(newLead, existingLeads) {
    const phoneMatch = detectReturningCustomer(newLead.client_number, existingLeads);

    if (phoneMatch.isReturning) {
        return {
            isDuplicate: true,
            type: 'phone_match',
            message: 'Phone number already exists in system',
            existingLeads: phoneMatch.existingLeads,
            suggestedAction: 'MERGE_OR_NEW',
            mergeCandidate: phoneMatch.existingLeads[0]
        };
    }

    // Check for company name similarity (fuzzy match)
    if (newLead.client_company) {
        const companyNormalized = newLead.client_company.toLowerCase().replace(/[^a-z0-9]/g, '');
        const companyMatches = existingLeads.filter(lead => {
            const existing = (lead.client_company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return existing && (
                existing.includes(companyNormalized) ||
                companyNormalized.includes(existing) ||
                levenshteinDistance(existing, companyNormalized) < 3
            );
        });

        if (companyMatches.length > 0) {
            return {
                isDuplicate: true,
                type: 'company_match',
                message: 'Similar company name found',
                existingLeads: companyMatches,
                suggestedAction: 'REVIEW',
                confidence: 'MEDIUM'
            };
        }
    }

    return {
        isDuplicate: false
    };
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }
    return track[str2.length][str1.length];
}

export default {
    generateLeadId,
    parseLeadId,
    initializeSequence,
    detectReturningCustomer,
    detectDuplicate,
    getRegionCode,
    getInquiryTypeCode,
    getOwnerCode,
    REGION_CODES,
    INQUIRY_TYPE_CODES
};
