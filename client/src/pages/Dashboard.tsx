import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  TrendingUp, Users, Phone, DollarSign, AlertCircle, RefreshCw,
  Calendar, Clock, Target, ArrowRight, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, Bell, ChevronRight
} from 'lucide-react';
import { fetchLeadStats, fetchTodayFollowUps, fetchLeads, StatsResponse, FollowUp, formatValue, ApiError } from '../lib/api';

// Quick metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, subtitle, icon: Icon, iconColor = 'text-primary', trend, onClick
}) => (
  <div
    className={`glass-card p-5 rounded-2xl group hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className={`p-2 rounded-xl bg-gradient-to-br ${iconColor === 'text-primary' ? 'from-primary/20 to-primary/5' :
          iconColor === 'text-green-500' ? 'from-green-100 to-green-50' :
            iconColor === 'text-purple-500' ? 'from-purple-100 to-purple-50' :
              iconColor === 'text-amber-500' ? 'from-amber-100 to-amber-50' :
                'from-blue-100 to-blue-50'
        }`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    {trend && (
      <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
        {trend.positive ? <TrendingUp className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        <span>{trend.value}% vs last week</span>
      </div>
    )}
    {onClick && (
      <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        View details <ArrowRight className="w-3 h-3" />
      </div>
    )}
  </div>
);

// Pipeline stage component with animation
interface PipelineStageProps {
  stages: { name: string; count: number; color: string }[];
  total: number;
}

const PipelineStages: React.FC<PipelineStageProps> = ({ stages, total }) => (
  <div className="space-y-3">
    {stages.map((stage, index) => {
      const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
      return (
        <div key={stage.name} className="group cursor-pointer">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className="text-foreground group-hover:text-primary transition-colors">{stage.name}</span>
            </div>
            <span className="text-muted-foreground font-medium">
              {stage.count.toLocaleString()} <span className="text-xs">({percentage}%)</span>
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${stage.color} rounded-full transition-all duration-700 ease-out`}
              style={{
                width: `${percentage}%`,
                transitionDelay: `${index * 100}ms`
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

// Follow-up task component
interface FollowUpTaskProps {
  followUp: FollowUp;
  onComplete?: () => void;
}

const FollowUpTask: React.FC<FollowUpTaskProps> = ({ followUp, onComplete }) => (
  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-xl hover:from-primary/10 transition-colors group">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Phone className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-foreground truncate">{followUp.client_name}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{followUp.client_number}</span>
        <span>•</span>
        <span className={`px-1.5 py-0.5 rounded ${followUp.priority === 'High' ? 'bg-red-100 text-red-700' :
            followUp.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
          }`}>
          {followUp.priority}
        </span>
      </div>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onComplete?.(); }}
      className="p-2 hover:bg-green-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
    >
      <CheckCircle className="w-4 h-4 text-green-600" />
    </button>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Ref to track if we should stop polling (after auth error)
  const shouldPollRef = useRef(true);

  const loadData = async () => {
    // Don't fetch if we've had an auth error
    if (!shouldPollRef.current) return;
    
    try {
      setLoading(true);
      const [statsRes, followUpsRes, leadsRes] = await Promise.all([
        fetchLeadStats(),
        fetchTodayFollowUps(),
        fetchLeads({ limit: 5, sortBy: 'date', sortOrder: 'desc' })
      ]);
      setStats(statsRes.data);
      setFollowUps(followUpsRes.data || []);
      setRecentLeads(leadsRes.data || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      // Stop polling on auth errors to prevent retry loops
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        shouldPollRef.current = false;
        return; // Auth handler will redirect to login
      }
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (shouldPollRef.current) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusData = stats?.statusCounts || {};
  const owners = Object.entries(stats?.ownerCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Calculate pipeline stages for visualization
  const pipelineStages = [
    { name: 'New', count: statusData['New'] || 0, color: 'bg-blue-500' },
    { name: 'Working', count: statusData['Working'] || 0, color: 'bg-yellow-500' },
    { name: 'Potential', count: statusData['Potential'] || 0, color: 'bg-purple-500' },
    { name: 'MQL', count: statusData['MQL'] || 0, color: 'bg-indigo-500' },
    { name: 'SQL', count: statusData['SQL'] || 0, color: 'bg-cyan-500' },
    { name: 'Under Discussion', count: statusData['Under discussions'] || 0, color: 'bg-orange-500' },
    { name: 'PO Received', count: statusData['PO RCVD'] || 0, color: 'bg-green-500' },
    { name: 'Lost', count: statusData['Lost'] || 0, color: 'bg-red-500' },
  ];

  const handleNavToLeads = (status?: string) => {
    const url = status ? `/leads?status=${status}` : '/leads';
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const activeLeads = (statusData['Working'] || 0) + (statusData['Potential'] || 0) +
    (statusData['MQL'] || 0) + (statusData['SQL'] || 0);

  // Win rate calculation
  const wonDeals = statusData['PO RCVD'] || 0;
  const lostDeals = statusData['Lost'] || 0;
  const totalClosed = wonDeals + lostDeals;
  const winRate = totalClosed > 0 ? Math.round((wonDeals / totalClosed) * 100) : 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sales Dashboard</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time sync with Google Sheets • Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={loadData} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* KPI Cards - Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Leads"
          value={loading ? '...' : (stats?.totalLeads || 0).toLocaleString()}
          subtitle="From Google Sheets DB"
          icon={Users}
          iconColor="text-blue-500"
          onClick={() => handleNavToLeads()}
        />
        <MetricCard
          title="Active Pipeline"
          value={loading ? '...' : activeLeads.toLocaleString()}
          subtitle="Working + MQL + SQL"
          icon={Activity}
          iconColor="text-purple-500"
          onClick={() => handleNavToLeads('MQL')}
        />
        <MetricCard
          title="PO Received"
          value={loading ? '...' : (statusData['PO RCVD'] || 0).toLocaleString()}
          subtitle="Closed & Won"
          icon={CheckCircle}
          iconColor="text-green-500"
          onClick={() => handleNavToLeads('PO RCVD')}
        />
        <MetricCard
          title="Total Revenue"
          value={loading ? '...' : formatValue(stats?.totalPOValue || 0)}
          subtitle="Lifetime PO value"
          icon={DollarSign}
          iconColor="text-amber-500"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Today's Leads
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.todayLeads || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Follow-ups
          </div>
          <p className="text-2xl font-bold text-foreground">{followUps.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Target className="w-3.5 h-3.5" />
            Win Rate
          </div>
          <p className="text-2xl font-bold text-green-600">{winRate}%</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <XCircle className="w-3.5 h-3.5" />
            Lost Deals
          </div>
          <p className="text-2xl font-bold text-red-500">{statusData['Lost'] || 0}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline Distribution - Takes 2 columns */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Pipeline Distribution</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Lead status breakdown</p>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <PipelineStages stages={pipelineStages} total={stats?.totalLeads || 1} />
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Today's Tasks</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{followUps.length} follow-ups scheduled</p>
            </div>
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {followUps.length > 0 ? (
              followUps.map((fu, idx) => (
                <FollowUpTask key={idx} followUp={fu} />
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-3" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/60">No pending follow-ups for today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sales Owners */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Top Sales Owners</h2>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {owners.map(([owner, count], index) => (
              <div
                key={owner}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/50 to-transparent rounded-xl hover:from-secondary transition-colors cursor-pointer"
                onClick={() => handleNavToLeads()}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-primary/10 text-primary'
                  }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{owner}</p>
                  <p className="text-xs text-muted-foreground">{count.toLocaleString()} leads</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {Math.round((count / (stats?.totalLeads || 1)) * 100)}%
                  </p>
                </div>
              </div>
            ))}
            {owners.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Leads</h2>
            <button
              onClick={() => handleNavToLeads()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead, idx) => (
              <div
                key={lead.id || idx}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => handleNavToLeads()}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {lead.client_company || lead.client_person || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">{lead.product || lead.location || '-'}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'PO RCVD' ? 'bg-green-100 text-green-700' :
                      'bg-secondary text-muted-foreground'
                  }`}>
                  {lead.status || 'New'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-6 border border-primary/10">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleNavToLeads()}
            className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-all hover:scale-[1.02] border border-transparent hover:border-primary/20"
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">All Leads</p>
          </button>
          <button
            onClick={() => handleNavToLeads('New')}
            className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-all hover:scale-[1.02] border border-transparent hover:border-blue-200"
          >
            <Phone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">New Leads</p>
            <p className="text-xs text-muted-foreground">{statusData['New'] || 0}</p>
          </button>
          <button
            onClick={() => handleNavToLeads('MQL')}
            className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-all hover:scale-[1.02] border border-transparent hover:border-purple-200"
          >
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">MQL Pipeline</p>
            <p className="text-xs text-muted-foreground">{statusData['MQL'] || 0}</p>
          </button>
          <button
            onClick={() => handleNavToLeads('PO RCVD')}
            className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-all hover:scale-[1.02] border border-transparent hover:border-green-200"
          >
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Won Deals</p>
            <p className="text-xs text-muted-foreground">{statusData['PO RCVD'] || 0}</p>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
