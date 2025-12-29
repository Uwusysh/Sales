import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AgentContext';
import { useNavigate } from '../../hooks/useNavigate';
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Receipt,
    LogOut,
    Menu,
    X,
    Mic,
    Brain,
    CheckCircle2,
    Bell,
    Settings,
    ChevronDown
} from 'lucide-react';
import { getSyncStatus } from '../../lib/api';

// Navigation configuration - includes skeleton for future modules
const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        enabled: true
    },
    {
        label: 'Leads',
        href: '/leads',
        icon: Users,
        enabled: true,
        badge: 'Live'
    },
    {
        label: 'SRF',
        href: '/srf',
        icon: FileText,
        enabled: true,
        comingSoon: false
    },
    {
        label: 'Quotations',
        href: '/quotations',
        icon: Receipt,
        enabled: true,
        comingSoon: false
    },
    {
        label: 'Orders',
        href: '/orders',
        icon: Package,
        enabled: true,
        comingSoon: false
    },
];

// Future modules skeleton (Phase 2+)
const futureModules = [
    {
        label: 'Transcription',
        href: '/transcription',
        icon: Mic,
        description: 'AI Call Recording',
        phase: 2
    },
    {
        label: 'SRF Automation',
        href: '/srf-automation',
        icon: Brain,
        description: 'Auto-fill SRF',
        phase: 2
    },
    {
        label: 'PI Engine',
        href: '/pi-engine',
        icon: CheckCircle2,
        description: 'PI Approval Flow',
        phase: 2
    },
];

interface SyncIndicatorProps {
    status: 'synced' | 'syncing' | 'stale' | 'error';
    lastSync?: string;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, lastSync }) => {
    const statusConfig = {
        synced: { color: 'bg-green-500', text: 'Synced' },
        syncing: { color: 'bg-blue-500 animate-pulse', text: 'Syncing...' },
        stale: { color: 'bg-yellow-500', text: 'Stale' },
        error: { color: 'bg-red-500', text: 'Error' }
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            <span>{config.text}</span>
            {lastSync && <span className="opacity-50">• {lastSync}</span>}
        </div>
    );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFutureModules, setShowFutureModules] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'stale' | 'error'>('synced');
    const [lastSyncTime, setLastSyncTime] = useState<string>('');

    const currentPath = window.location.pathname;
    const isAdmin = user?.role === 'admin';

    // Check sync status periodically
    useEffect(() => {
        const checkSync = async () => {
            try {
                const response = await getSyncStatus();
                const age = response.data.cacheAge;

                if (age < 30000) {
                    setSyncStatus('synced');
                } else if (age < 60000) {
                    setSyncStatus('stale');
                } else {
                    setSyncStatus('stale');
                }

                setLastSyncTime(new Date(response.data.lastSync).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            } catch {
                setSyncStatus('error');
            }
        };

        checkSync();
        const interval = setInterval(checkSync, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavClick = (href: string, enabled: boolean = true) => {
        if (!enabled) return;
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 bg-card border-r border-border
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                flex flex-col
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">S</span>
                        </div>
                        <div>
                            <span className="text-lg font-bold text-primary">SalesOS</span>
                            <span className="text-[10px] text-muted-foreground ml-1">v2.0</span>
                        </div>
                    </div>
                    <button
                        className="md:hidden p-2 hover:bg-secondary rounded-lg"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sync Status */}
                <div className="px-4 py-3 border-b border-border/50">
                    <SyncIndicator status={syncStatus} lastSync={lastSyncTime} />
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Main
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '?');
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href, item.enabled)}
                                disabled={!item.enabled}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                                    transition-all duration-200
                                    ${!item.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </div>
                                {item.badge && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {item.badge}
                                    </span>
                                )}
                                {item.comingSoon && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        Soon
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Future Modules Section */}
                    <div className="pt-4 mt-4 border-t border-border/50">
                        <button
                            onClick={() => setShowFutureModules(!showFutureModules)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                        >
                            <span>Phase 2 Modules</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFutureModules ? 'rotate-180' : ''}`} />
                        </button>

                        {showFutureModules && (
                            <div className="mt-2 space-y-1">
                                {futureModules.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={item.href}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/60 bg-muted/30"
                                        >
                                            <Icon className="w-5 h-5" />
                                            <div className="flex-1">
                                                <p>{item.label}</p>
                                                <p className="text-[10px] opacity-60">{item.description}</p>
                                            </div>
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                                P{item.phase}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-sm font-bold ring-2 ring-primary/10">
                            {user?.agentName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{user?.agentName || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-green-500'}`} />
                                {user?.role || 'Agent'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => handleNavClick('/settings')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="md:hidden lg:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 hover:bg-secondary rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-semibold text-primary">SalesOS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SyncIndicator status={syncStatus} />
                        <button className="p-2 hover:bg-secondary rounded-lg relative">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
