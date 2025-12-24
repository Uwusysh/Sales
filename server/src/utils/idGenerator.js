
/**
 * Generates a unique Lead ID based on Phase 0.4 specs.
 * Format: YYMMDD-TYPE-RR-OWN-CS
 * Example: 251223-WEB-DL-SR-9X
 * 
 * @param {string} type - Inquiry Source Code (WEB, REF, IND)
 * @param {string} region - Region Code (DL, MU)
 * @param {string} owner - Owner Code (SR, DK)
 * @returns {string} Unique Lead ID
 */
export function generateLeadID(type = 'WEB', region = 'DL', owner = 'SR') {
    const date = new Date();

    // 1. YYMMDD
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');

    // 2. Checksum (2 random alphanumeric chars)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const checksum =
        chars.charAt(Math.floor(Math.random() * chars.length)) +
        chars.charAt(Math.floor(Math.random() * chars.length));

    return `${yymmdd}-${type}-${region}-${owner}-${checksum}`;
}
