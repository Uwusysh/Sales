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
    fetchLeads, fetchLeadStats, refreshLeadsCache,
    Lead, FetchLeadsOptions, formatValue, getRelativeTime,
    fetchLeadById, scheduleFollowUp
} from '../lib/api';
import { useNavigate } from '../hooks/useNavigate';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { VoiceInput } from '../components/ui/VoiceInput';

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
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                </span>
            </div>
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
        myLeads: number;
        totalPOValue: number;
        todayLeads: number;
        followUpDue: number;
        statusCounts: Record<string, number>;
        ownerCounts: Record<string, number>;
        locationCounts: Record<string, number>;
        isAdmin: boolean;
    } | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);

    // Detail View State
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({
        date: '',
        time: '',
        notes: '',
        types: ['Call'] as string[]
    });

    const { user } = useAuth();
    const navigate = useNavigate();
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

            // First fetch stats to know if user is admin
            const statsRes = await fetchLeadStats();
            const isAdminUser = statsRes.data.isAdmin;
            setStats(statsRes.data);

            // If viewMode is 'my', force owner filter to current user's agent code/name
            // Admin can view all leads when viewMode is 'all'
            const effectiveOwnerFilter = viewMode === 'my' && user?.agentName
                ? user.agentName
                : (ownerFilter !== 'all' ? ownerFilter : undefined);

            // Only admin can use viewAll parameter
            const shouldViewAll = isAdminUser && viewMode === 'all';

            const leadsRes = await fetchLeads({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                owner: effectiveOwnerFilter,
                location: locationFilter !== 'all' ? locationFilter : undefined,
                search: debouncedSearch || undefined,
                sortBy,
                sortOrder,
                offset: 0,
                limit: 100 * page,
                viewAll: shouldViewAll
            });

            setLeads(leadsRes.data);
            setHasMore(leadsRes.meta.hasMore);
            setStatusCounts(leadsRes.meta.statusCounts);
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

    // Load full details when lead is selected
    useEffect(() => {
        if (selectedLead?.id) {
            // Only fetch if we don't have followups yet or if it was just selected
            // We can detect if it's "fresh" from the list by checking if followups is undefined
            if (!selectedLead.followups) {
                setIsDetailLoading(true);
                fetchLeadById(selectedLead.id)
                    .then(res => {
                        setSelectedLead(prev => prev ? { ...prev, ...res.data } : res.data);
                    })
                    .catch(console.error)
                    .finally(() => setIsDetailLoading(false));
            }
        }
    }, [selectedLead?.id]);

    const handleScheduleFollowUp = async () => {
        if (!selectedLead || !followUpForm.date || followUpForm.types.length === 0) return;

        try {
            setIsDetailLoading(true);
            await scheduleFollowUp(selectedLead.id, {
                follow_up_date: followUpForm.date,
                follow_up_time: followUpForm.time,
                notes: followUpForm.notes,
                follow_up_type: followUpForm.types.join(', '),
                sales_owner: user?.agentName || selectedLead.lead_owner
            });

            // Refresh details
            const res = await fetchLeadById(selectedLead.id);
            setSelectedLead(res.data);

            // Reset form
            setShowFollowUpForm(false);
            setFollowUpForm({ date: '', time: '', notes: '', types: ['Call'] });

            // Refresh list in background
            loadLeads();
        } catch (err) {
            console.error('Failed to schedule follow-up:', err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // Check if user is admin (Pushpalata)
    const isAdmin = stats?.isAdmin || false;

    return (
        <AppLayout>
            {/* Header Stats - Personalized + Actionable */}
            <div className={`grid ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'} gap-3 mb-6`}>
                {/* Total Leads Card - ONLY visible to Admin (Pushpalata) */}
                {isAdmin && (
                    <div
                        onClick={() => { setViewMode('all'); setStatusFilter('all'); }}
                        className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-500 ${viewMode === 'all' && statusFilter === 'all' ? 'ring-2 ring-purple-500/30 bg-purple-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Leads</p>
                            <Building2 className="w-4 h-4 text-purple-500" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats?.totalLeads || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-1">All database records</p>
                        <span className="inline-flex items-center gap-1 mt-2 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Admin View
                        </span>
                    </div>
                )}

                <div
                    onClick={() => { setViewMode('my'); setStatusFilter('all'); }}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${viewMode === 'my' ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Leads</p>
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">
                        {stats?.myLeads || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
                </div>

                <div
                    onClick={() => {
                        setStatusFilter('New');
                        setViewMode('my');
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
                    onClick={() => navigate('/followups')}
                    className="glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Follow-ups Due</p>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.followUpDue || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tasked for Today & Overdue</p>
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
                    {/* All Leads button - Only visible to Admin */}
                    {isAdmin && (
                        <button
                            onClick={() => setViewMode('all')}
                            className={`
                                flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all
                                ${viewMode === 'all'
                                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            All Leads
                        </button>
                    )}
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
                    // For 'all' bucket: admins see total, agents see their own count (myLeads)
                    const count = status === 'all' 
                        ? (isAdmin && viewMode === 'all' ? stats?.totalLeads : stats?.myLeads)
                        : statusCounts[status];
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

            {/* Lead Detail Modal Panel */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedLead(null)}
                    />
                    <div className="relative w-full max-w-3xl bg-card shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                        {/* Panel Header */}
                        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border p-4 flex items-start justify-between z-10">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-foreground truncate">
                                    {selectedLead.client_company || selectedLead.client_person}
                                </h2>
                                <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
                                    {selectedLead.lead_id || selectedLead.enquiry_code}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(selectedLead.status)}`}>
                                        {selectedLead.status}
                                    </span>
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

                            {/* Follow-up Timeline & Actions */}
                            <div className="bg-secondary/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Activity Timeline
                                    </h3>
                                    {!showFollowUpForm && (
                                        <button
                                            onClick={() => setShowFollowUpForm(true)}
                                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            + Add Follow-up
                                        </button>
                                    )}
                                </div>

                                {showFollowUpForm && (
                                    <div className="bg-background border border-border rounded-lg p-3 mb-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">New Date</label>
                                                    <input
                                                        type="date"
                                                        value={followUpForm.date}
                                                        onChange={e => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                                                        className="w-full text-sm p-2 rounded border border-border"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">Time (Optional)</label>
                                                    <input
                                                        type="time"
                                                        value={followUpForm.time}
                                                        onChange={e => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                                                        className="w-full text-sm p-2 rounded border border-border"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-muted-foreground uppercase font-semibold mb-2 block">Types (Select multiple)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { id: 'Call', label: '📞 Call' },
                                                        { id: 'WhatsApp', label: '💬 WhatsApp' },
                                                        { id: 'Email', label: '📧 Email' },
                                                        { id: 'Meeting', label: '🤝 Meeting' },
                                                        { id: 'Site Visit', label: '🏗️ Site Visit' },
                                                        { id: 'Follow-up', label: '🔄 Follow-up' }
                                                    ].map(type => {
                                                        const isSelected = followUpForm.types.includes(type.id);
                                                        return (
                                                            <button
                                                                key={type.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setFollowUpForm({
                                                                            ...followUpForm,
                                                                            types: followUpForm.types.filter(t => t !== type.id)
                                                                        });
                                                                    } else {
                                                                        setFollowUpForm({
                                                                            ...followUpForm,
                                                                            types: [...followUpForm.types, type.id]
                                                                        });
                                                                    }
                                                                }}
                                                                className={`
                                                                    px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                                                    ${isSelected
                                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                                        : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                                                                    }
                                                                `}
                                                            >
                                                                {type.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">Notes / Remarks</label>
                                                <VoiceInput
                                                    value={followUpForm.notes}
                                                    onChange={(val) => setFollowUpForm({ ...followUpForm, notes: val })}
                                                    placeholder="What happened? What's next? (Type or speak)"
                                                    minHeight="60px"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => setShowFollowUpForm(false)}
                                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleScheduleFollowUp}
                                                    disabled={!followUpForm.date}
                                                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    Save Follow-up
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {isDetailLoading ? (
                                        <div className="flex justify-center py-4">
                                            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            {selectedLead.followups && selectedLead.followups.length > 0 ? (
                                                <div className="relative border-l border-primary/20 ml-2 space-y-6 pl-4 pb-2">
                                                    {selectedLead.followups.map((fu, idx) => (
                                                        <div key={idx} className="relative">
                                                            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background ${fu.completed === 'Yes' ? 'bg-green-500' :
                                                                new Date(fu.follow_up_date) < new Date() ? 'bg-red-500' : 'bg-primary'
                                                                }`} />
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="font-semibold text-foreground">
                                                                        {new Date(fu.follow_up_date).toLocaleDateString('en-IN', {
                                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                    <span className="bg-secondary px-1.5 rounded text-[10px] text-muted-foreground">
                                                                        {fu.follow_up_type}
                                                                    </span>
                                                                    {fu.sales_owner && (
                                                                        <span className="text-muted-foreground text-[10px]">by {fu.sales_owner}</span>
                                                                    )}
                                                                </div>
                                                                {fu.notes && (
                                                                    <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                                                                        {fu.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-xs text-muted-foreground">
                                                    No history found.
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Legacy Remarks Fallback */}
                                    {selectedLead.remarks && (!selectedLead.followups || selectedLead.followups.length === 0) && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">Legacy Remarks</p>
                                            <p className="text-sm text-foreground whitespace-pre-wrap bg-background p-2 rounded border border-border">
                                                {selectedLead.remarks}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

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
