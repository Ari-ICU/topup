'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
    DollarSign, Package, Users,
    Calendar, Gamepad2,
    CheckCircle, Clock, X, ArrowRight, AlertCircle
} from 'lucide-react';

const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor = "bg-indigo-500/10",
    textColor = "text-indigo-400",
    trend,
    description
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    iconColor?: string;
    textColor?: string;
    trend?: string;
    description?: string;
}) => {
    return (
        <div className="group relative bg-[#0f0e16] rounded-3xl p-5 border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1">
            <div className={`absolute -right-8 -top-8 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity ${iconColor}`} />
            <div className="relative z-10 flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl ${iconColor} flex items-center justify-center border border-white/5 transition-transform duration-500 group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${textColor} drop-shadow-[0_0_8px_currentColor]`} />
                </div>
                {trend && (
                    <div className="bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 text-[8px] font-black text-emerald-400 tracking-tighter uppercase italic">
                        {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10 space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
                <h3 className="text-xl font-black text-white tracking-tight italic">{value}</h3>
                {description && (
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">{description}</p>
                )}
            </div>
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        providerWalletBalance: 0,
        totalTransferredRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        activeGames: 0,
        globalStockDiamonds: -1,
        recentTransactions: [] as any[],
        chartData: [] as { month: string, topup: number, card: number }[],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferAmount, setTransferAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedPeriod, setSelectedPeriod] = useState('1Y');

    const fetchData = async (period: string = selectedPeriod) => {
        setIsLoading(true);
        try {
            const overviewData = await apiRequest<typeof stats>(`/admin/overview?period=${period}`);
            setStats(prev => ({ ...prev, ...overviewData }));
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedPeriod);
    }, [selectedPeriod]);

    const handleTransferClick = () => {
        const available = Number(stats.revenue) - Number(stats.totalTransferredRevenue);
        if (available <= 0) return;
        setTransferAmount(available.toFixed(2));
        setShowTransferModal(true);
    };

    const confirmTransfer = async () => {
        const available = Number(stats.revenue) - Number(stats.totalTransferredRevenue);
        const amount = parseFloat(transferAmount);

        if (isNaN(amount) || amount <= 0 || amount > available) {
            return;
        }

        setIsSubmitting(true);
        try {
            await apiRequest('/admin/wallet/transfer', {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
            await fetchData();
            setShowTransferModal(false);
        } catch (error: any) {
            console.error(error.message || "Failed to transfer funds.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Monthly orders mock (fallback)
    const monthlyData = [
        { month: 'Jan', topup: 20, card: 30 },
        { month: 'Feb', topup: 15, card: 25 },
        { month: 'Mar', topup: 45, card: 85 },
        { month: 'Apr', topup: 52, card: 60 },
        { month: 'May', topup: 48, card: 68 },
        { month: 'Jun', topup: 45, card: 40 },
        { month: 'Jul', topup: 55, card: 38 },
        { month: 'Aug', topup: 50, card: 58 },
        { month: 'Sep', topup: 22, card: 35 },
        { month: 'Oct', topup: 42, card: 62 },
        { month: 'Nov', topup: 40, card: 52 },
        { month: 'Dec', topup: 55, card: 70 },
    ];

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-10 animate-fade-in text-slate-200 pb-20">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase flex items-center gap-3">
                        <span className="text-indigo-500">Dashboard</span> Overview
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Real-time platform metrics</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#0f0e16] border border-white/5 rounded-2xl px-5 py-2.5 flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Services</span>
                    </div>
                </div>
            </div>

            {/* ── Key Cards Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Glass Card for Main Revenue */}
                <div className="lg:col-span-8 relative min-h-[240px] bg-[#12111d] rounded-[3rem] border border-white/5 p-8 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Site Performance</span>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Financial Center</h2>
                            </div>
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-white/5">
                                <DollarSign className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 group/card transition-all hover:bg-white/[0.04]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Customer Revenue</p>
                                    <button
                                        onClick={() => handleTransferClick()}
                                        disabled={Number(stats.revenue) - Number(stats.totalTransferredRevenue) <= 0}
                                        className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <DollarSign className="w-2 h-2" />
                                        Transfer to Wallet
                                    </button>
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tighter">${Number(stats.revenue || 0).toLocaleString()}</h3>
                                <p className="text-[8px] font-bold text-slate-600 uppercase mt-2 tracking-tighter">
                                    Available: ${(Number(stats.revenue) - Number(stats.totalTransferredRevenue)).toFixed(2)} / Total Sold
                                </p>
                            </div>

                            <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 group/card transition-all hover:bg-white/[0.04]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Provider Wallet</p>
                                    <a href="https://moogold.com/my-account/wallet/" target="_blank" className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-500/10">
                                        Deposit Funds
                                    </a>
                                </div>
                                <h3 className="text-3xl font-black text-slate-200 tracking-tighter">${Number(stats.providerWalletBalance || 0).toLocaleString()}</h3>
                                <p className="text-[8px] font-bold text-slate-600 uppercase mt-2 tracking-tighter">Your balance to buy diamonds</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right stats cards stacked */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-5 h-full">
                    <StatCard
                        title="Completed"
                        value={(stats.completedOrders || 0).toLocaleString()}
                        icon={CheckCircle}
                        iconColor="bg-sky-500/10"
                        textColor="text-sky-400"
                    />
                    <StatCard
                        title="Pending"
                        value={(stats.pendingOrders || 0).toLocaleString()}
                        icon={Clock}
                        iconColor="bg-orange-500/10"
                        textColor="text-orange-400"
                    />
                    <StatCard
                        title="Stock"
                        value={stats.globalStockDiamonds === -1 ? '∞' : stats.globalStockDiamonds.toLocaleString()}
                        icon={Package}
                        iconColor="bg-purple-500/10"
                        textColor="text-purple-400"
                    />
                    <StatCard
                        title="Games"
                        value={stats.activeGames.toString()}
                        icon={Gamepad2}
                        iconColor="bg-pink-500/10"
                        textColor="text-pink-400"
                    />
                </div>
            </div>

            {/* ── Analytics Section ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-2">
                {/* Advanced Chart Card */}
                <div className="xl:col-span-8 bg-[#12111d] rounded-[3rem] border border-white/5 p-2 md:p-10 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Revenue Analytics</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Order Volume Distribution {currentYear}</p>
                        </div>
                        <div className="flex bg-[#0a0a14] p-1.5 rounded-2xl border border-white/5">
                            {['7D', '30D', '6M', '1Y'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedPeriod(t)}
                                    className={`px-4 py-2 rounded-xl text-[8px] font-black transition-all ${selectedPeriod === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[350px] flex items-end justify-between px-2 pb-10 gap-2 relative">
                        {[0, 25, 50, 75, 100].map(val => (
                            <div key={val} className="absolute left-0 right-0 border-t border-white/[0.04] flex items-center" style={{ bottom: `${val + 10}%` }}>
                                <span className="text-[8px] font-black text-slate-700 -ml-12 w-8 text-right pr-4">{val}%</span>
                            </div>
                        ))}

                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.5em] animate-pulse">Syncing Data...</span>
                            </div>
                        ) : (stats.chartData.length > 0 ? stats.chartData : monthlyData).map((d) => {
                            const maxVal = Math.max(...(stats.chartData.length > 0 ? stats.chartData : monthlyData).map(m => Math.max(m.topup, m.card, 1)), 10);
                            const topupHeight = (d.topup / maxVal) * 85;
                            const cardHeight = (d.card / maxVal) * 85;

                            return (
                                <div key={d.month} className="flex-1 flex flex-col items-center group/bar relative h-full justify-end">
                                    <div className="flex gap-1.5 w-full items-end justify-center h-full pb-8">
                                        <div
                                            className="w-1/4 min-w-[3px] md:min-w-[8px] bg-indigo-500 rounded-full opacity-40 group-hover/bar:opacity-100 transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                            style={{ height: `${topupHeight}%` }}
                                        />
                                        <div
                                            className="w-1/4 min-w-[3px] md:min-w-[8px] bg-indigo-400 rounded-full group-hover/bar:bg-indigo-300 transition-all duration-700 shadow-[0_0_20px_rgba(129,140,248,0.3)]"
                                            style={{ height: `${cardHeight}%` }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-600 uppercase mt-4 absolute bottom-0 tracking-tighter">
                                        {d.month.includes(' ') ? d.month : d.month.substring(0, 3)}
                                    </span>

                                    <div className="absolute bottom-full mb-6 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-90 group-hover/bar:scale-100 z-30 pointer-events-none">
                                        <div className="bg-[#1b1a29]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl min-w-[120px]">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 text-center">{d.month}</p>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[9px] font-bold">
                                                    <span className="text-slate-400 uppercase">Completed</span>
                                                    <span className="text-white">{d.topup}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] font-bold">
                                                    <span className="text-slate-400 uppercase">Failed</span>
                                                    <span className="text-white">{d.card}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Card / Schedule */}
                <div className="xl:col-span-4 bg-[#12111d] rounded-[3rem] border border-white/5 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                        <h3 className="text-sm font-black text-white italic uppercase tracking-[0.2em]">{currentMonth}</h3>
                        <Calendar className="w-5 h-5 text-indigo-500 opacity-50" />
                    </div>

                    <div className="grid grid-cols-7 text-center gap-y-4 mb-8">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={`${day}-${i}`} className="text-[10px] font-black text-slate-600 uppercase">{day}</div>
                        ))}
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className={`text-[11px] font-bold h-9 w-9 flex items-center justify-center rounded-xl transition-all ${i + 1 === new Date().getDate() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5 cursor-default'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Operations Status</h4>
                        <div className="bg-[#0a0a14] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-wider">System Live</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">All providers active</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Transfer Modal ────────────────────────────────────────── */}
            {showTransferModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => !isSubmitting && setShowTransferModal(false)} />

                    <div className="relative w-full max-w-md bg-[#0f0e16] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-scale-in overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]" />
                        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Internal Transfer</h3>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Revenue to Provider Wallet</p>
                                </div>
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Info Box */}
                                <div className="bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/10 flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/5">
                                        <AlertCircle className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                                        Transferring funds will move them from your <span className="text-white">Customer Revenue</span> pool directly into your <span className="text-indigo-400">Provider Wallet</span> for purchasing stock.
                                    </p>
                                </div>

                                {/* Available Amount */}
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Available to transfer</span>
                                    <span className="text-lg font-black text-white italic tracking-tight">
                                        ${(Number(stats.revenue) - Number(stats.totalTransferredRevenue)).toFixed(2)}
                                    </span>
                                </div>

                                {/* Input Field */}
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 block">Amount to Transfer ($)</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-5 flex items-center">
                                            <span className="text-slate-500 font-bold">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-10 pr-6 text-white font-black text-lg focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => setShowTransferModal(false)}
                                        className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all transition-transform active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > (Number(stats.revenue) - Number(stats.totalTransferredRevenue))}
                                        onClick={() => confirmTransfer()}
                                        className="flex-1 py-4 bg-indigo-600 border border-indigo-500/50 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Confirm Transfer</span>
                                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
