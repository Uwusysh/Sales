import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AgentContext';
import { AppLayout } from '../components/layout/AppLayout';
import {
    Search, RefreshCw, ChevronRight, Phone, MapPin,
    Filter, ArrowUpDown, ArrowUp, ArrowDown, Plus, X, Clock,
    CheckCircle, AlertCircle, User, Building2,
    Package, Edit2, FileText, ExternalLink, TrendingUp
} from 'lucide-react';
import {
    fetchLeads, fetchLeadStats, refreshLeadsCache, updateLeadStatus,
    Lead, FetchLeadsOptions, formatValue, getRelativeTime
} from '../lib/api';
import { AddLeadModal } from '../components/leads/AddLeadModal';

// Status color mapping with enhanced styling
const statusColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    'Working': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    'Potential': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    'MQL': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    'SQL': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
    'Under discussions': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    'PO RCVD': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    'Lost': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    'Closed': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};

const STATUS_BUCKETS = ['all', 'New', 'Working', 'Potential', 'MQL', 'SQL', 'Under discussions', 'PO RCVD', 'Lost'];
const SORT_OPTIONS = [
    { value: 'date', label: 'Date' },
    { value: 'company', label: 'Company' },
    { value: 'status', label: 'Status' },
    { value: 'owner', label: 'Owner' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'value', label: 'Value' },
];

// SRF Progress Component
const SRFProgress: React.FC<{ percentage: string }> = ({ percentage }) => {
    const pct = parseInt(percentage) || 0;
    const getColor = () => {
        if (pct >= 100) return 'bg-green-500';
        if (pct >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
    );
};

// Follow-up Badge Component
const FollowUpBadge: React.FC<{ date: string }> = ({ date }) => {
    if (!date) return null;

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const isPast = date < today;
    const isTomorrow = (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date === tomorrow.toISOString().split('T')[0];
    })();

    if (isToday) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full animate-pulse">
                <Clock className="w-3 h-3" />
                Today
            </span>
        );
    }

    if (isPast) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Overdue
            </span>
        );
    }

    if (isTomorrow) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                Tomorrow
            </span>
        );
    }

    return (
        <span className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
    );
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<FetchLeadsOptions['sortBy']>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [stats, setStats] = useState<{
        totalLeads: number;
        totalPOValue: number;
        todayLeads: number;
        statusCounts: Record<string, number>;
        ownerCounts: Record<string, number>;
        locationCounts: Record<string, number>;
    } | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);

    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'all' | 'my'>('my');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, ownerFilter, locationFilter, debouncedSearch, sortBy, sortOrder, viewMode]);

    const loadLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // If viewMode is 'my', force owner filter to current user's agent code/name
            // Assuming user.agentName correlates with lead_owner or sales_owner
            const effectiveOwnerFilter = viewMode === 'my' && user?.agentName
                ? user.agentName
                : (ownerFilter !== 'all' ? ownerFilter : undefined);

            const [leadsRes, statsRes] = await Promise.all([
                fetchLeads({
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    owner: effectiveOwnerFilter,
                    location: locationFilter !== 'all' ? locationFilter : undefined,
                    search: debouncedSearch || undefined,
                    sortBy,
                    sortOrder,
                    offset: 0,
                    limit: 100 * page
                }),
                fetchLeadStats()
            ]);

            setLeads(leadsRes.data);
            setHasMore(leadsRes.meta.hasMore);
            setStatusCounts(leadsRes.meta.statusCounts);
            setStats(statsRes.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, ownerFilter, locationFilter, debouncedSearch, sortBy, sortOrder, page, viewMode, user]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(loadLeads, 30000);
        return () => clearInterval(interval);
    }, [loadLeads]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC to close panel
            if (e.key === 'Escape' && selectedLead) {
                setSelectedLead(null);
            }
            // Ctrl+K for search focus
            if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                document.getElementById('lead-search')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedLead]);

    const handleRefresh = async () => {
        await refreshLeadsCache();
        loadLeads();
    };

    const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
        try {
            await updateLeadStatus(leadId, newStatus);
            loadLeads();
        } catch (err) {
            console.error('Status update failed:', err);
        }
    };

    const getStatusStyle = (status: string) => {
        const style = statusColors[status] || statusColors['New'];
        return `${style.bg} ${style.text} border ${style.border}`;
    };

    const toggleSort = (field: FetchLeadsOptions['sortBy']) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <AppLayout>
            {/* Header Stats - Personalized + Actionable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div
                    onClick={() => { setViewMode('all'); setStatusFilter('all'); }}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${viewMode === 'all' && statusFilter === 'all' ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Leads</p>
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalLeads || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-1">All database records</p>
                </div>

                <div
                    onClick={() => { setViewMode('my'); setStatusFilter('all'); }}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${viewMode === 'my' ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Leads</p>
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    {/* Note: This count is rough until backend supports explicit 'my count', usually handled by owner filter */}
                    <p className="text-2xl font-bold text-primary mt-1">
                        {stats?.ownerCounts?.[user?.agentName || ''] || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
                </div>

                <div
                    onClick={() => {
                        setStatusFilter('New'); // Assuming 'New' means pending call
                        setViewMode('all'); // Or 'my' depending on preference, sticking to all for broader view
                    }}
                    className="glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Calls</p>
                        <Phone className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.statusCounts?.['New'] || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Status: New</p>
                </div>

                <div
                    onClick={() => {
                        // Since we don't have a direct 'today' filter on frontend state easily without modifying API significantly, 
                        // we'll rely on the visual badge or existing followups/today endpoint.
                        // Ideally, this should trigger a "Follow-ups" view.
                        // For now, let's just show the count.
                    }}
                    className="glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Follow-ups Due</p>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    {/* This would ideally come from a specific stat */}
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.todayLeads || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tasked for Today</p>
                </div>
            </div>

            {/* View Toggle & Add Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center bg-secondary/50 p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('my')}
                        className={`
                            flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all
                            ${viewMode === 'my'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        My View
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`
                            flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all
                            ${viewMode === 'all'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        All Leads
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowAddLeadModal(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Lead
                    </button>
                </div>
            </div>

            {/* Status Buckets - Fast Navigation */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {STATUS_BUCKETS.map(status => {
                    const isActive = statusFilter === status;
                    const count = status === 'all' ? stats?.totalLeads : statusCounts[status];
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                                transition-all duration-200 shrink-0
                                ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:scale-[1.02]'
                                }
                            `}
                        >
                            {status !== 'all' && (
                                <span className={`w-2 h-2 rounded-full ${statusColors[status]?.dot || 'bg-gray-400'}`} />
                            )}
                            <span>{status === 'all' ? 'All' : status}</span>
                            {count !== undefined && count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20' : 'bg-background'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search, Sort & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        id="lead-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search phone, company, city, product... (Ctrl+K)"
                        className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Sort & Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 border rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {(statusFilter !== 'all' || sortBy !== 'date') && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>

                    <div className="relative hidden md:block">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as FetchLeadsOptions['sortBy'])}
                            className="appearance-none pl-3 pr-8 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
                            ))}
                        </select>
                        <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        title="Refresh (syncs with Google Sheets)"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
                <div className="glass-card p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Lead Owner</label>
                        <select
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={ownerFilter}
                            onChange={(e) => setOwnerFilter(e.target.value)}
                        >
                            <option value="all">All Owners</option>
                            {Object.keys(stats?.ownerCounts || {}).sort().map(owner => (
                                <option key={owner} value={owner}>{owner}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Territory / State</label>
                        <select
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {Object.keys(stats?.locationCounts || {}).sort().map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Sort By</label>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as FetchLeadsOptions['sortBy'])}
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2 border border-border rounded-lg bg-background hover:bg-secondary"
                            >
                                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setOwnerFilter('all');
                                setLocationFilter('all');
                                setSearch('');
                                setSortBy('date');
                                setSortOrder('desc');
                                setPage(1);
                            }}
                            className="flex-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                        >
                            Clear all filters
                        </button>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={loadLeads} className="ml-auto text-sm underline">Retry</button>
                </div>
            )}

            {/* Leads Table - Optimized for Speed */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('company')}>
                        Client
                        {sortBy === 'company' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                    <div className="col-span-2">Contact</div>
                    <div className="col-span-1">City</div>
                    <div className="col-span-2">Product</div>
                    <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('status')}>
                        Status
                    </div>
                    <div className="col-span-1">SRF %</div>
                    <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('followup')}>
                        Follow-up
                    </div>
                    <div className="col-span-1">Owner</div>
                </div>

                {/* Loading State */}
                {loading && leads.length === 0 && (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                        <p className="text-muted-foreground">Loading leads from Google Sheets...</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">First load may take a few seconds</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && leads.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">No leads found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {search ? 'Try adjusting your search terms' : 'No leads match the selected filter'}
                        </p>
                    </div>
                )}

                {/* Leads List - Virtual-like rendering for performance */}
                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                    {leads.map((lead) => (
                        <div
                            key={lead.id || lead._rowNumber}
                            onClick={() => setSelectedLead(lead)}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-primary/5 transition-colors cursor-pointer group"
                        >
                            {/* Client - Mobile: Full width card, Desktop: Grid */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">
                                            {lead.client_company || lead.client_person || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            {lead.lead_id || lead.enquiry_code}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate font-mono">{lead.client_number || '-'}</span>
                            </div>

                            {/* City */}
                            <div className="col-span-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 shrink-0 hidden md:block" />
                                <span className="truncate">{lead.location || '-'}</span>
                            </div>

                            {/* Product */}
                            <div className="col-span-2 text-sm text-muted-foreground truncate">
                                {lead.product || '-'}
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyle(lead.status)}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[lead.status]?.dot || 'bg-gray-400'}`} />
                                    {lead.status || 'New'}
                                </span>
                            </div>

                            {/* SRF Completion */}
                            <div className="col-span-1 hidden md:block">
                                <SRFProgress percentage={lead.srf_completion_pct || '0'} />
                            </div>

                            {/* Follow-up */}
                            <div className="col-span-1 hidden md:block">
                                <FollowUpBadge date={lead.follow_up_date} />
                            </div>

                            {/* Owner */}
                            <div className="col-span-1 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground truncate">{lead.lead_owner || '-'}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="p-4 flex justify-center border-t border-border bg-muted/5">
                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            className="flex items-center gap-2 px-6 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-all shadow-sm"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Load More Leads
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
                    <span>
                        Showing <strong>{leads.length}</strong> of <strong>{stats?.totalLeads || 0}</strong> leads
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live sync every 30s</span>
                    </div>
                </div>
            </div>

            {/* Add Lead Modal */}
            <AddLeadModal
                isOpen={showAddLeadModal}
                onClose={() => setShowAddLeadModal(false)}
                onSuccess={() => {
                    handleRefresh();
                    // Optionally show a toast here
                }}
            />

            {/* Lead Detail Slide-over Panel */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedLead(null)}
                    />
                    <div className="relative w-full max-w-lg bg-card shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border p-4 flex items-start justify-between z-10">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-foreground truncate">
                                    {selectedLead.client_company || selectedLead.client_person}
                                </h2>
                                <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
                                    {selectedLead.lead_id || selectedLead.enquiry_code}
                                    {selectedLead.is_returning_customer === 'Yes' && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded">
                                            Returning
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-secondary rounded-lg">
                                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="p-2 hover:bg-secondary rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Quick Status Change */}
                            <div className="flex flex-wrap gap-2">
                                {STATUS_BUCKETS.filter(s => s !== 'all').map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleQuickStatusChange(selectedLead.id, status)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                            ${selectedLead.status === status
                                                ? getStatusStyle(status) + ' ring-2 ring-offset-2 ring-primary/20'
                                                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary'
                                            }
                                        `}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {/* Contact Info Card */}
                            <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Phone</p>
                                        <a
                                            href={`tel:${selectedLead.client_number}`}
                                            className="font-medium text-primary hover:underline flex items-center gap-1"
                                        >
                                            {selectedLead.client_number || '-'}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Email</p>
                                        <a
                                            href={`mailto:${selectedLead.client_email}`}
                                            className="font-medium truncate block hover:text-primary"
                                        >
                                            {selectedLead.client_email || '-'}
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Location</p>
                                        <p className="font-medium">{selectedLead.location || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Industry</p>
                                        <p className="font-medium">{selectedLead.industry || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Product Requirements
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Product</p>
                                        <p className="font-medium">{selectedLead.product || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Size</p>
                                        <p className="font-medium">{selectedLead.size || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Quantity</p>
                                        <p className="font-medium">{selectedLead.quantity || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Budget</p>
                                        <p className="font-medium text-primary">{selectedLead.budget ? formatValue(selectedLead.budget) : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Pipeline */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Sales Pipeline
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Lead Owner</p>
                                        <p className="font-medium">{selectedLead.lead_owner || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Lead Source</p>
                                        <p className="font-medium">{selectedLead.lead_source || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Follow-up Date</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{selectedLead.follow_up_date || '-'}</p>
                                            <FollowUpBadge date={selectedLead.follow_up_date} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Expected Closure</p>
                                        <p className="font-medium">{selectedLead.expected_closure || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs">SRF Completion</p>
                                        <div className="mt-1">
                                            <SRFProgress percentage={selectedLead.srf_completion_pct || '0'} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info (if exists) */}
                            {(selectedLead.po_number || selectedLead.po_value) && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                                    <h3 className="text-xs font-semibold text-green-800 uppercase tracking-wider flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Order Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-green-600 text-xs">PO Number</p>
                                            <p className="font-medium text-green-900">{selectedLead.po_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-green-600 text-xs">PO Value</p>
                                            <p className="font-medium text-green-900">{selectedLead.po_value ? formatValue(selectedLead.po_value) : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remarks */}
                            {selectedLead.remarks && (
                                <div className="bg-secondary/30 rounded-xl p-4">
                                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Remarks</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedLead.remarks}</p>
                                </div>
                            )}

                            {/* Action Links */}
                            <div className="grid grid-cols-2 gap-2">
                                {selectedLead.srf_pdf_link && (
                                    <a
                                        href={selectedLead.srf_pdf_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View SRF
                                    </a>
                                )}
                                {selectedLead.quotation_link && (
                                    <a
                                        href={selectedLead.quotation_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View Quotation
                                    </a>
                                )}
                                {selectedLead.pi_link && (
                                    <a
                                        href={selectedLead.pi_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View PI
                                    </a>
                                )}
                            </div>

                            {/* Timestamps */}
                            <div className="text-xs text-muted-foreground/60 pt-4 border-t border-border space-y-1">
                                <p>Created: {selectedLead.created_at ? getRelativeTime(selectedLead.created_at) : selectedLead.date || '-'}</p>
                                {selectedLead.updated_at && <p>Updated: {getRelativeTime(selectedLead.updated_at)}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
