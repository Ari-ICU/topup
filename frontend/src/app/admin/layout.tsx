'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams, notFound } from 'next/navigation';
import { LayoutDashboard, Gamepad2, Package, Receipt, Settings, LogOut, Bell, Search, Star, Menu, X, Users, Key } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const SidebarItem = ({
    icon: Icon,
    label,
    href,
    isActive,
    onClick,
}: {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive?: boolean;
    onClick?: () => void;
}) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 border ${isActive
                ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-white border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
        >
            <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-indigo-400 scale-110' : 'group-hover:text-slate-300'}`} />
            <span className={`text-sm tracking-wide transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
        </Link>
    );
};

function AdminSearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set('q', val);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex relative w-full max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.08] transition-all"
            />
        </div>
    );
}

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { logout, isChecking, isAuthenticated } = useAuth();

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = () => {
        logout();
    };

    // 🛡️ Masking Logic:
    // If not logged in and not providing the secret access key, act as if the route doesn't exist.
    // The secret key is only needed to see the LOGIN page initially.
    const hasSecretKey = searchParams?.get('access') === 'master';
    const isLoginPage = pathname === '/admin/login';

    if (!isChecking && !isAuthenticated) {
        if (isLoginPage && hasSecretKey) {
            // Allow login page only with secret key
            return <div className="bg-[#0a0910] min-h-screen">{children}</div>;
        }
        // Mask everything else as 404
        return notFound();
    }

    if (isLoginPage && isAuthenticated) {
        // Handled by router replace in context but just in case
        return null;
    }

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0a0910] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#0a0910] flex text-slate-200">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0c16]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transform transition-transform duration-500 ease-in-out lg:relative lg:h-screen lg:shrink-0 lg:translate-x-0 overflow-y-auto custom-scrollbar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo Section */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-500/20 shadow-lg flex items-center justify-center relative bg-slate-900 group">
                            <Image src="/package-logo.png" alt="Dai-Game" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">
                                DAI<span className="text-purple-400">-GAME</span>
                            </h1>
                            <p className="text-[9px] text-slate-500 font-black tracking-[0.2em] uppercase mt-1">Admin Portal</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={closeSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-8">
                    <nav className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4 mb-4">Core</p>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/admin" isActive={pathname === '/admin'} onClick={closeSidebar} />

                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4 mb-4 mt-8">Resources</p>
                        <SidebarItem icon={Gamepad2} label="Games" href="/admin/games" isActive={pathname === '/admin/games'} onClick={closeSidebar} />
                        <SidebarItem icon={Package} label="Packages" href="/admin/packages" isActive={pathname === '/admin/packages'} onClick={closeSidebar} />
                        <SidebarItem icon={Receipt} label="Transactions" href="/admin/transactions" isActive={pathname === '/admin/transactions'} onClick={closeSidebar} />
                        <SidebarItem icon={Star} label="Promotions" href="/admin/promotions" isActive={pathname === '/admin/promotions'} onClick={closeSidebar} />

                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4 mb-4 mt-8">System</p>

                        <SidebarItem icon={Key} label="Reseller Api" href="/admin/api-key" isActive={pathname === '/admin/api-key'} onClick={closeSidebar} />
                        <SidebarItem icon={Settings} label="Settings" href="/admin/settings" isActive={pathname === '/admin/settings'} onClick={closeSidebar} />
                    </nav>
                </div>

                {/* Footer / User */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02] shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header */}
                <header className="bg-[#0d0c16]/40 backdrop-blur-xl border-b border-white/5 z-30 shrink-0">
                    <div className="px-6 lg:px-10 py-5 flex justify-between items-center gap-6">
                        <div className="flex items-center gap-6 flex-1">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <Menu className="w-6 h-6 text-white" />
                            </button>

                            <Suspense fallback={
                                <div className="flex relative w-full max-w-sm">
                                    <div className="w-full h-10 bg-white/5 rounded-xl animate-pulse" />
                                </div>
                            }>
                                <AdminSearchBar />
                            </Suspense>
                        </div>

                        <div className="flex items-center space-x-6 lg:space-x-8">
                            {/* Notifications */}
                            <button className="relative p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0d0c16] animate-pulse"></span>
                            </button>

                            {/* User Profile */}
                            <div className="flex items-center space-x-3 md:space-x-4 pl-4 md:pl-6 border-l border-white/5">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-white leading-none whitespace-nowrap">Admin User</p>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-tighter mt-1 uppercase">Administrator</p>
                                </div>
                                <div className="w-10 h-10 md:w-11 md:h-11 rounded-1.5xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] border border-white/10 transform hover:rotate-6 transition-transform cursor-pointer shrink-0">
                                    AU
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

const LoadingFallback = () => (
    <div className="min-h-screen bg-[#0a0910] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
);

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}

