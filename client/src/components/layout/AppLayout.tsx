import React, { useState } from 'react';
import { useAuth } from '../../contexts/AgentContext';
import { useNavigate } from '../../hooks/useNavigate';
import { LayoutDashboard, Users, FileText, Package, Receipt, LogOut, Menu, X } from 'lucide-react';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', href: '/leads', icon: Users },
    { label: 'SRF', href: '/srf', icon: FileText },
    { label: 'Quotations', href: '/quotations', icon: Receipt },
    { label: 'Orders', href: '/orders', icon: Package },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = window.location.pathname;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavClick = (href: string) => {
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
                    <span className="text-xl font-bold text-primary">SalesOS</span>
                    <button
                        className="md:hidden p-2 hover:bg-secondary rounded-lg"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '?');
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                    transition-all duration-200
                                    ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {user?.agentName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{user?.agentName || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Agent'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-card border-b border-border flex items-center px-4 gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-secondary rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-semibold text-primary">SalesOS</span>
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
