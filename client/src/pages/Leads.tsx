import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Search, RefreshCw, ChevronRight, Phone, MapPin } from 'lucide-react';
import { fetchLeads, fetchLeadStats, refreshLeadsCache, Lead } from '../lib/api';

// Status color mapping
const statusColors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
    'Working': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Potential': 'bg-purple-100 text-purple-700 border-purple-200',
    'MQL': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'SQL': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Under discussions': 'bg-orange-100 text-orange-700 border-orange-200',
    'PO RCVD': 'bg-green-100 text-green-700 border-green-200',
    'Lost': 'bg-red-100 text-red-700 border-red-200',
    'Closed': 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_BUCKETS = ['all', 'New', 'Working', 'Potential', 'MQL', 'SQL', 'Under discussions', 'PO RCVD', 'Lost'];

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [stats, setStats] = useState<{ totalLeads: number; totalPOValue: number } | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const loadLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [leadsRes, statsRes] = await Promise.all([
                fetchLeads({
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    search: search || undefined,
                    limit: 200
                }),
                fetchLeadStats()
            ]);

            setLeads(leadsRes.data);
            setStatusCounts(leadsRes.meta.statusCounts);
            setStats(statsRes.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(loadLeads, 30000);
        return () => clearInterval(interval);
    }, [loadLeads]);

    const handleRefresh = async () => {
        await refreshLeadsCache();
        loadLeads();
    };

    const getStatusColor = (status: string) => {
        return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <AppLayout>
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalLeads?.toLocaleString() || '-'}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Active Pipeline</p>
                    <p className="text-2xl font-bold text-foreground">
                        {((statusCounts['Working'] || 0) + (statusCounts['Potential'] || 0) + (statusCounts['MQL'] || 0)).toLocaleString()}
                    </p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">PO Received</p>
                    <p className="text-2xl font-bold text-green-600">{statusCounts['PO RCVD'] || 0}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Total PO Value</p>
                    <p className="text-2xl font-bold text-primary">₹{((stats?.totalPOValue || 0) / 100000).toFixed(1)}L</p>
                </div>
            </div>

            {/* Status Buckets */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {STATUS_BUCKETS.map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                            }`}
                    >
                        {status === 'all' ? 'All' : status}
                        {status !== 'all' && statusCounts[status] ? (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                                {statusCounts[status]}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone, location..."
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2.5 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {/* Leads Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-3">Client</div>
                    <div className="col-span-2">Contact</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Product</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Owner</div>
                </div>

                {/* Loading State */}
                {loading && leads.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading leads from Google Sheets...
                    </div>
                )}

                {/* Empty State */}
                {!loading && leads.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        No leads found matching your criteria.
                    </div>
                )}

                {/* Leads List */}
                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                    {leads.map((lead) => (
                        <div
                            key={lead.id || lead._rowNumber}
                            onClick={() => setSelectedLead(lead)}
                            className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-secondary/30 transition-colors cursor-pointer group"
                        >
                            <div className="col-span-3">
                                <p className="font-medium text-foreground text-sm truncate">
                                    {lead.client_company || lead.client_person || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                    {lead.enquiry_code}
                                </p>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{lead.client_number || '-'}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{lead.location || '-'}</span>
                            </div>
                            <div className="col-span-2 text-sm text-muted-foreground truncate">
                                {lead.product || '-'}
                            </div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                    {lead.status || 'New'}
                                </span>
                            </div>
                            <div className="col-span-1 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground truncate">{lead.lead_owner || '-'}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground flex justify-between">
                    <span>Showing {leads.length} of {stats?.totalLeads || 0} leads</span>
                    <span>Auto-refreshes every 30s</span>
                </div>
            </div>

            {/* Lead Detail Slide-over */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLead(null)} />
                    <div className="relative w-full max-w-lg bg-card shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">{selectedLead.client_company || selectedLead.client_person}</h2>
                                <p className="text-sm text-muted-foreground font-mono">{selectedLead.enquiry_code}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-secondary rounded-lg">
                                ✕
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(selectedLead.status)}`}>
                                    {selectedLead.status || 'New'}
                                </span>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedLead.client_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium truncate">{selectedLead.client_email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Location</p>
                                        <p className="font-medium">{selectedLead.location || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Industry</p>
                                        <p className="font-medium">{selectedLead.industry || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Product Requirements</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Product</p>
                                        <p className="font-medium">{selectedLead.product || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Size</p>
                                        <p className="font-medium">{selectedLead.size || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Quantity</p>
                                        <p className="font-medium">{selectedLead.quantity || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Budget</p>
                                        <p className="font-medium">{selectedLead.budget || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Info */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Sales Pipeline</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Lead Owner</p>
                                        <p className="font-medium">{selectedLead.lead_owner || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Lead Source</p>
                                        <p className="font-medium">{selectedLead.lead_source || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Follow-up Date</p>
                                        <p className="font-medium">{selectedLead.follow_up_date || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Expected Closure</p>
                                        <p className="font-medium">{selectedLead.expected_closure || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            {(selectedLead.po_number || selectedLead.po_value) && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-green-800">Order Details</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-green-600">PO Number</p>
                                            <p className="font-medium text-green-900">{selectedLead.po_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-green-600">PO Value</p>
                                            <p className="font-medium text-green-900">{selectedLead.po_value || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remarks */}
                            {selectedLead.remarks && (
                                <div className="bg-secondary/30 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-foreground mb-2">Remarks</h3>
                                    <p className="text-sm text-muted-foreground">{selectedLead.remarks}</p>
                                </div>
                            )}

                            {/* Links */}
                            <div className="flex gap-2">
                                {selectedLead.srf_pdf_link && (
                                    <a href={selectedLead.srf_pdf_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 px-4 bg-primary/10 text-primary rounded-lg text-sm font-medium text-center hover:bg-primary/20 transition-colors">
                                        View SRF
                                    </a>
                                )}
                                {selectedLead.quotation_link && (
                                    <a href={selectedLead.quotation_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 px-4 bg-primary/10 text-primary rounded-lg text-sm font-medium text-center hover:bg-primary/20 transition-colors">
                                        View Quotation
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
