import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { TrendingUp, Users, Phone, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchLeadStats, StatsResponse } from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetchLeadStats();
      setStats(response.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusData = stats?.statusCounts || {};
  const owners = Object.entries(stats?.ownerCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Leads</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {loading ? '...' : (stats?.totalLeads || 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">From Google Sheets DB</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Active Pipeline</span>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {loading ? '...' : (
              (statusData['Working'] || 0) +
              (statusData['Potential'] || 0) +
              (statusData['MQL'] || 0) +
              (statusData['SQL'] || 0)
            ).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Working + MQL + SQL</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">PO Received</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : (statusData['PO RCVD'] || 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Closed orders</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total PO Value</span>
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            ₹{loading ? '...' : ((stats?.totalPOValue || 0) / 100000).toFixed(1)}L
          </p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime revenue</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Pipeline Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(statusData)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([status, count]) => {
                const total = stats?.totalLeads || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">{status}</span>
                      <span className="text-muted-foreground">{count.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Owners */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Top Sales Owners
          </h2>
          <div className="space-y-3">
            {owners.map(([owner, count], index) => (
              <div key={owner} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
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
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/leads" className="p-4 bg-background rounded-xl text-center hover:shadow-md transition-shadow">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">View All Leads</p>
          </a>
          <a href="/leads?status=New" className="p-4 bg-background rounded-xl text-center hover:shadow-md transition-shadow">
            <Phone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">New Leads</p>
          </a>
          <a href="/leads?status=MQL" className="p-4 bg-background rounded-xl text-center hover:shadow-md transition-shadow">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">MQL Pipeline</p>
          </a>
          <a href="/leads?status=PO RCVD" className="p-4 bg-background rounded-xl text-center hover:shadow-md transition-shadow">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Won Deals</p>
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
