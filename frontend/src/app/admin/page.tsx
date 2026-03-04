'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
    DollarSign, Gamepad2, Receipt, Users, TrendingUp,
    ArrowUpRight, ArrowDownRight, Star, CheckCircle, XCircle, FlaskConical
} from 'lucide-react';

// ─── Provider Status Types ────────────────────────────────────────────────────
interface ProviderStatus {
    activeProvider: string;
    isTestMode: boolean;
    isReady: boolean;
    missingFields: string[];
    warning: string | null;
}

// ─── Provider Banner Component ────────────────────────────────────────────────
const ProviderStatusBanner = ({ status }: { status: ProviderStatus | null }) => {
    if (!status) return null;

    if (status.isReady) {
        return (
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <span className="font-black uppercase tracking-widest text-xs">Provider Active</span>
                    <p className="text-sm text-emerald-400/70 mt-0.5">
                        Real diamonds will be delivered via <strong className="text-emerald-300">{status.activeProvider}</strong>.
                    </p>
                </div>
            </div>
        );
    }

    if (status.isTestMode) {
        return (
            <div className="flex items-start gap-4 px-6 py-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-200 shadow-[0_10px_30px_-10px_rgba(234,179,8,0.2)] animate-pulse-slow">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                    <p className="font-black uppercase tracking-[0.15em] text-xs text-yellow-400">Environment: Test Mode</p>
                    <p className="text-sm mt-1 text-yellow-300/70 leading-relaxed">
                        No real diamonds will be delivered. Disable
                        <code className="mx-1 px-1.5 py-0.5 bg-yellow-500/10 rounded font-mono text-xs">MOOGOLD_TEST_MODE</code>
                        in <code className="px-1.5 py-0.5 bg-yellow-500/10 rounded font-mono text-xs">.env</code> to Enable Real Sales.
                    </p>
                    <Link href="/admin/settings" className="inline-flex items-center mt-3 text-xs font-black uppercase tracking-widest text-yellow-500 hover:text-yellow-300 transition-colors">
                        Configure Real Provider →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-4 px-6 py-5 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-200 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.2)]">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
                <p className="font-black uppercase tracking-[0.15em] text-xs text-red-400">Orders Blocked — No Provider</p>
                <p className="text-sm mt-1 text-red-300/70 leading-relaxed">
                    Set up a provider (MooGold, Digiflazz, etc.) in settings to start accepting orders.
                </p>
                {status.missingFields?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 uppercase font-black text-[9px] tracking-widest opacity-60">
                        Missing API Keys: {status.missingFields.join(", ")}
                    </div>
                )}
                <Link href="/admin/settings" className="inline-flex items-center mt-3 text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-200 transition-colors">
                    Access Settings →
                </Link>
            </div>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection = 'up',
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend: string;
    trendDirection?: 'up' | 'down';
}) => {
    const isPositive = trendDirection === 'up';
    return (
        <div className="group relative bg-white/[0.02] rounded-3xl border border-white/5 p-7 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{title}</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{value}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-6 h-6 text-indigo-400" />
                </div>
            </div>

            <div className="relative mt-6 flex items-center">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
                <span className="ml-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Growth</span>
            </div>
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        transactions: 0,
        activeGames: 0,
        globalStockDiamonds: -1,
        pendingReviews: 0,
        recentTransactions: [] as any[],
        chartData: [] as { date: string, amount: number }[],
        metrics: {
            conversionRate: '0.00%',
            avgTicketSize: '$0.00',
            customerLTV: '$0.00'
        }
    });
    const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [overviewData, providerData] = await Promise.all([
                apiRequest<typeof stats>('/admin/overview'),
                apiRequest<ProviderStatus>('/admin/provider-status'),
            ]);
            setStats(overviewData);
            setProviderStatus(providerData);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm italic">
                        DAI<span className="text-purple-400">-GAME</span> DASHBOARD
                    </h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">Executive Overview & Analytics</p>
                </div>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all hover:-translate-y-1 active:scale-95">
                    Generate Report
                </button>
            </div>

            {/* ── Provider Status Banner ─── */}
            {!isLoading && <div className="max-w-4xl"><ProviderStatusBanner status={providerStatus} /></div>}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                    title="Gross Revenue"
                    value={`$${Number(stats.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    trend="+15.4%"
                />
                <StatCard
                    title="Active Portfolio"
                    value={stats.activeGames.toString()}
                    icon={Gamepad2}
                    trend="+2 Games"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.transactions.toLocaleString()}
                    icon={Receipt}
                    trend="+24 Orders"
                />
                <StatCard
                    title="Supplier Balance"
                    value={stats.globalStockDiamonds === -1 ? '∞' : stats.globalStockDiamonds.toLocaleString()}
                    icon={Users}
                    trend={providerStatus?.isReady ? "Live Sync" : "Automated"}
                />
                <Link href="/admin/reviews" className="block transform transition-transform">
                    <StatCard
                        title="Market Feedback"
                        value={stats.pendingReviews.toString()}
                        icon={Star}
                        trend={stats.pendingReviews > 0 ? 'Urgent' : 'All approved'}
                        trendDirection={stats.pendingReviews > 0 ? 'up' : 'down'}
                    />
                </Link>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Chart Placeholder */}
                <div className="lg:col-span-2 relative bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-10 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                        <TrendingUp className="w-64 h-64 text-indigo-500" />
                    </div>

                    <div className="relative flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tight">REVENUE PERFORMANCE</h3>
                            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-2">Historical data visualization</p>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+12.4% ATH</span>
                        </div>
                    </div>

                    <div className="relative h-[400px] w-full bg-white/[0.01] rounded-3xl border border-white/5 flex flex-col items-center justify-center p-8 text-center group/inner">
                        {stats.chartData?.length > 0 ? (
                            <>
                                <div className="absolute inset-0 flex items-end justify-center px-10 pb-16 gap-2">
                                    {stats.chartData.map((d, i) => {
                                        const max = Math.max(...stats.chartData.map(c => c.amount)) || 1;
                                        const height = (d.amount / max) * 100;
                                        return (
                                            <div key={d.date} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-indigo-500/30 rounded-t-lg border-t border-indigo-400 group-hover/inner:bg-indigo-500/50 transition-all duration-700"
                                                    style={{ height: `${Math.max(10, height)}%` }}
                                                />
                                                <span className="text-[7px] font-black text-slate-600 mt-2 uppercase">{d.date.split('-').slice(1).join('/')}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <h4 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs uppercase tracking-[0.3em] opacity-20 pointer-events-none">Revenue Stream Live</h4>
                            </>
                        ) : (
                            <>
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-20 h-20 rounded-[2rem] bg-indigo-500/20 flex items-center justify-center transform group-hover/inner:rotate-12 transition-transform duration-500">
                                        <TrendingUp className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                    </div>
                                </div>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em]">Processing Visual Data</h4>
                                <p className="text-slate-500 text-[10px] font-bold mt-3 leading-relaxed max-w-xs">
                                    Securely fetching transaction stream...
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="flex flex-col gap-8">
                    <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-10">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10">Market Metrics</h3>
                        <div className="space-y-6">
                            <MetricItem label="Conversion Efficiency" value={stats.metrics.conversionRate} color="indigo" />
                            <MetricItem label="Average Ticket Size" value={stats.metrics.avgTicketSize} color="purple" />
                            <MetricItem label="Customer LTV" value={stats.metrics.customerLTV} color="emerald" />
                        </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-10 flex-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8 italic">Recent Operations</h3>
                        <div className="space-y-4">
                            {stats.recentTransactions?.length > 0 ? (
                                stats.recentTransactions.map((txn) => (
                                    <div key={txn.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform ${txn.status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                            txn.status === 'FAILED' ? 'bg-red-500 shadow-red-500/50' : 'bg-indigo-500'
                                            }`} />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{txn.status === 'COMPLETED' ? 'FULFILLED' : txn.status}</p>
                                            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                                                {txn.package?.game?.name} • {txn.package?.name} • ${txn.totalAmount}
                                                {txn.playerInfo?.playerName && <span className="text-indigo-400 ml-1">• Name: {txn.playerInfo.playerName}</span>}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-[10px] text-slate-600 font-black tracking-widest uppercase py-10">No recent activity detected</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MetricItem = ({ label, value, color }: { label: string, value: string, color: 'indigo' | 'purple' | 'emerald' }) => {
    const colors = {
        indigo: 'bg-indigo-500 text-indigo-400 shadow-indigo-500/20',
        purple: 'bg-purple-500 text-purple-400 shadow-purple-500/20',
        emerald: 'bg-emerald-500 text-emerald-400 shadow-emerald-500/20',
    };
    return (
        <div className="flex items-center justify-between group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
            <div className="flex flex-col items-end">
                <span className="text-lg font-black text-white tabular-nums drop-shadow-sm">{value}</span>
                <div className={`h-0.5 w-full rounded-full mt-1 opacity-20 ${colors[color]}`} />
            </div>
        </div>
    );
};
