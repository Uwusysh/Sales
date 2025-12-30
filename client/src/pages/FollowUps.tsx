import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AgentContext';
import { AppLayout } from '../components/layout/AppLayout';
import {
    Clock, AlertCircle, CheckCircle, Phone, Calendar,
    RefreshCw, User, MapPin, Package, ChevronRight,
    MessageSquare, Mail, Video, X, CheckSquare
} from 'lucide-react';
import {
    fetchActiveFollowUps, completeFollowUp, FollowUp
} from '../lib/api';
import { VoiceInput } from '../components/ui/VoiceInput';

// Priority colors
const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    'High': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Medium': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Low': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

// Follow-up type icons
const getFollowUpIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'call': return <Phone className="w-4 h-4" />;
        case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
        case 'email': return <Mail className="w-4 h-4" />;
        case 'meeting': return <Video className="w-4 h-4" />;
        default: return <Phone className="w-4 h-4" />;
    }
};

export default function FollowUpsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming' | 'all'>('today');
    const [followUps, setFollowUps] = useState<{
        overdue: FollowUp[];
        today: FollowUp[];
        upcoming: FollowUp[];
        all: FollowUp[];
    }>({ overdue: [], today: [], upcoming: [], all: [] });
    const [counts, setCounts] = useState({ overdue: 0, today: 0, upcoming: 0, total: 0 });
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
    const [completionForm, setCompletionForm] = useState({
        outcome: '',
        nextDate: ''
    });
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const [completingId, setCompletingId] = useState<string | null>(null);

    const loadFollowUps = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const owner = viewMode === 'my' ? user?.agentName : undefined;
            const response = await fetchActiveFollowUps(owner);

            setFollowUps(response.data);
            setCounts(response.counts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
        } finally {
            setLoading(false);
        }
    }, [viewMode, user]);

    useEffect(() => {
        loadFollowUps();
    }, [loadFollowUps]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(loadFollowUps, 60000);
        return () => clearInterval(interval);
    }, [loadFollowUps]);

    const handleSelectFollowUp = async (followUp: FollowUp) => {
        setSelectedFollowUp(followUp);
        // Note: Lead details could be loaded here if needed for the modal
    };

    // Quick complete - single click to mark as done
    const handleQuickComplete = async (followUp: FollowUp, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't open the modal
        
        const uniqueId = followUp.lead_id + followUp.follow_up_date;
        setCompletingId(uniqueId);
        
        try {
            await completeFollowUp(
                followUp.lead_id,
                followUp.follow_up_date,
                'Quick completed',
                undefined
            );
            // Reload to refresh the list
            await loadFollowUps();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete follow-up');
        } finally {
            setCompletingId(null);
        }
    };

    const handleCompleteFollowUp = async () => {
        if (!selectedFollowUp) return;

        try {
            setLoading(true);
            await completeFollowUp(
                selectedFollowUp.lead_id,
                selectedFollowUp.follow_up_date,
                completionForm.outcome,
                completionForm.nextDate || undefined
            );

            // Reset and reload
            setSelectedFollowUp(null);
            setCompletionForm({ outcome: '', nextDate: '' });
            await loadFollowUps();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete follow-up');
        } finally {
            setLoading(false);
        }
    };

    const currentFollowUps = followUps[activeTab] || [];

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-7 h-7 text-primary" />
                        Follow-Ups Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and track all your follow-up activities
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-secondary/50 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('my')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'my'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            My Follow-Ups
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'all'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            All Team
                        </button>
                    </div>

                    <button
                        onClick={loadFollowUps}
                        disabled={loading}
                        className="p-2.5 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div
                    onClick={() => setActiveTab('overdue')}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-500 ${activeTab === 'overdue' ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-1">{counts.overdue}</p>
                    <p className="text-xs text-muted-foreground mt-1">Needs immediate attention</p>
                </div>

                <div
                    onClick={() => setActiveTab('today')}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary ${activeTab === 'today' ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Today</p>
                        <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">{counts.today}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
                </div>

                <div
                    onClick={() => setActiveTab('upcoming')}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 ${activeTab === 'upcoming' ? 'ring-2 ring-blue-500/20 bg-blue-50/50' : ''
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming</p>
                        <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{counts.upcoming}</p>
                    <p className="text-xs text-muted-foreground mt-1">Future follow-ups</p>
                </div>

                <div
                    onClick={() => setActiveTab('all')}
                    className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-l-4 border-l-gray-500 ${activeTab === 'all' ? 'ring-2 ring-gray-500/20 bg-gray-50/50' : ''
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Active</p>
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-600 mt-1">{counts.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">All pending follow-ups</p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={loadFollowUps} className="ml-auto text-sm underline">Retry</button>
                </div>
            )}

            {/* Follow-Ups List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-3">Client</div>
                    <div className="col-span-2">Follow-Up Date</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Lead Info</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-1 text-right">Complete</div>
                </div>

                {/* Loading State */}
                {loading && currentFollowUps.length === 0 && (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                        <p className="text-muted-foreground">Loading follow-ups...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && currentFollowUps.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">All caught up!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            No {activeTab} follow-ups at the moment
                        </p>
                    </div>
                )}

                {/* Follow-Ups List */}
                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                    {currentFollowUps.map((followUp, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelectFollowUp(followUp)}
                            className={`grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-primary/5 transition-colors cursor-pointer group ${followUp.is_overdue ? 'bg-red-50/50' : followUp.is_today ? 'bg-primary/5' : ''
                                }`}
                        >
                            {/* Client */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${followUp.is_overdue ? 'bg-red-100' : 'bg-primary/10'
                                        }`}>
                                        <User className={`w-4 h-4 ${followUp.is_overdue ? 'text-red-600' : 'text-primary'
                                            }`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">
                                            {followUp.client_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            {followUp.client_number}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="col-span-2">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {new Date(followUp.follow_up_date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    {followUp.follow_up_time && (
                                        <p className="text-xs text-muted-foreground">
                                            {followUp.follow_up_time}
                                        </p>
                                    )}
                                    {followUp.is_overdue && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full w-fit">
                                            <AlertCircle className="w-3 h-3" />
                                            Overdue
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Type */}
                            <div className="col-span-1">
                                <div className="flex items-center gap-2">
                                    {getFollowUpIcon(followUp.follow_up_type)}
                                    <span className="text-sm text-muted-foreground hidden lg:inline">
                                        {followUp.follow_up_type}
                                    </span>
                                </div>
                            </div>

                            {/* Owner */}
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{followUp.sales_owner}</p>
                            </div>

                            {/* Lead Info */}
                            <div className="col-span-2">
                                <div className="flex flex-col gap-1">
                                    {followUp.lead_product && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {followUp.lead_product}
                                        </p>
                                    )}
                                    {followUp.lead_location && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {followUp.lead_location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="col-span-1">
                                {followUp.priority && (
                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${priorityColors[followUp.priority]?.bg || 'bg-gray-50'
                                        } ${priorityColors[followUp.priority]?.text || 'text-gray-700'
                                        } ${priorityColors[followUp.priority]?.border || 'border-gray-200'
                                        }`}>
                                        {followUp.priority}
                                    </span>
                                )}
                            </div>

                            {/* Action - Mark Complete Button */}
                            <div className="col-span-1 flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => handleQuickComplete(followUp, e)}
                                    disabled={completingId === (followUp.lead_id + followUp.follow_up_date)}
                                    className={`p-2 rounded-lg transition-all border ${
                                        completingId === (followUp.lead_id + followUp.follow_up_date)
                                            ? 'bg-green-100 border-green-300 cursor-wait'
                                            : 'hover:bg-green-50 border-transparent hover:border-green-200'
                                    }`}
                                    title="Mark as Completed"
                                >
                                    {completingId === (followUp.lead_id + followUp.follow_up_date) ? (
                                        <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                                    ) : (
                                        <CheckSquare className="w-4 h-4 text-green-600" />
                                    )}
                                </button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
                    <span>
                        Showing <strong>{currentFollowUps.length}</strong> {activeTab} follow-ups
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live sync with Google Sheets</span>
                    </div>
                </div>
            </div>

            {/* Completion Modal */}
            {selectedFollowUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => {
                            setSelectedFollowUp(null);
                            setCompletionForm({ outcome: '', nextDate: '' });
                        }}
                    />
                    <div className="relative w-full max-w-lg bg-card shadow-2xl rounded-xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="border-b border-border p-4 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Complete Follow-Up
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedFollowUp.client_name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFollowUp(null);
                                    setCompletionForm({ outcome: '', nextDate: '' });
                                }}
                                className="p-2 hover:bg-secondary rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Follow-Up Details */}
                            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">
                                        {new Date(selectedFollowUp.follow_up_date).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium">{selectedFollowUp.follow_up_type}</span>
                                </div>
                                {selectedFollowUp.notes && (
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                                        <p className="text-sm">{selectedFollowUp.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Outcome */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Outcome / Notes
                                </label>
                                <VoiceInput
                                    value={completionForm.outcome}
                                    onChange={(val) => setCompletionForm({ ...completionForm, outcome: val })}
                                    placeholder="What happened during this follow-up? (Type or speak)"
                                    className="bg-background"
                                    minHeight="100px"
                                />
                            </div>

                            {/* Next Follow-Up Date */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Next Follow-Up Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={completionForm.nextDate}
                                    onChange={(e) => setCompletionForm({ ...completionForm, nextDate: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-border bg-background text-sm"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-border p-4 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setSelectedFollowUp(null);
                                    setCompletionForm({ outcome: '', nextDate: '' });
                                }}
                                className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteFollowUp}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Completing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Completed
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
