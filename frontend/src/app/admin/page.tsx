'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import {
    DollarSign, Package, Receipt, Users, TrendingUp,
    Calendar, MousePointer2, Wallet, Layers, HelpCircle
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor = "bg-indigo-500/20",
    textColor = "text-indigo-400"
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    iconColor?: string;
    textColor?: string;
}) => {
    return (
        <div className="bg-[#12111d] rounded-3xl p-6 flex items-center gap-5 border border-white/5 shadow-xl transition-all hover:border-white/10 hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl ${iconColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-7 h-7 ${textColor}`} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{title}</p>
            </div>
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        transactions: 0,
        cardOrders: 0,
        activeGames: 0,
        globalStockDiamonds: -1,
        pendingReviews: 0,
        recentTransactions: [] as any[],
        chartData: [] as { month: string, topup: number, card: number }[],
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const overviewData = await apiRequest<typeof stats>('/admin/overview');
            setStats(overviewData);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Monthly orders mock (matching chart in screenshot)
    const monthlyData = [
        { month: 'January', topup: 20, card: 30 },
        { month: 'February', topup: 15, card: 25 },
        { month: 'March', topup: 45, card: 85 }, // Highlighted in screenshot
        { month: 'April', topup: 52, card: 60 },
        { month: 'May', topup: 48, card: 68 },
        { month: 'June', topup: 45, card: 40 },
        { month: 'July', topup: 55, card: 38 },
        { month: 'August', topup: 50, card: 58 },
        { month: 'September', topup: 22, card: 35 },
        { month: 'October', topup: 42, card: 62 },
        { month: 'November', topup: 40, card: 52 },
        { month: 'December', topup: 55, card: 70 },
    ];

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            {/* Top Breadcrumb */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-white tracking-tight italic">Dashboard</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Home &gt; Dashboard</p>
            </div>

            {/* Hero Welcome Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 bg-[#12111d] rounded-[2.5rem] border border-white/5 p-10 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-30" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                Hi!<br />
                                <span className="text-slate-200 opacity-90">What Do You Want To <span className="text-indigo-500">Buy</span> Today?</span>
                            </h2>
                            <p className="text-sm font-medium text-slate-400 max-w-md leading-relaxed">
                                Digital Game Marketplace offers a seamless shopping experience for gamers around the world.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-indigo-600/20">
                                    <MousePointer2 className="w-4 h-4" />
                                    Buy Now
                                </button>
                                <button className="px-8 py-3.5 bg-[#1b1a29] hover:bg-[#252336] border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95">
                                    <Wallet className="w-4 h-4" />
                                    Deposit
                                </button>
                            </div>
                        </div>

                        <div className="w-64 h-64 relative shrink-0">
                            <img
                                src={`/dashboard-mascot.png?v=${Date.now()}`}
                                alt="Mascot"
                                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-float"
                            />
                        </div>
                    </div>
                </div>

                {/* Right stats cards */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <StatCard
                        title="Main Balance"
                        value={`$${Number(stats.revenue).toLocaleString()}`}
                        icon={Wallet}
                        iconColor="bg-amber-500/10"
                        textColor="text-amber-400"
                    />
                    <StatCard
                        title="Top Up Order"
                        value={stats.transactions.toLocaleString()}
                        icon={TrendingUp}
                        iconColor="bg-sky-500/10"
                        textColor="text-sky-400"
                    />
                    <StatCard
                        title="Card Order"
                        value={stats.cardOrders.toLocaleString()}
                        icon={Layers}
                        iconColor="bg-emerald-500/10"
                        textColor="text-emerald-400"
                    />
                    <StatCard
                        title="Support Ticket"
                        value={stats.pendingReviews.toString()}
                        icon={HelpCircle}
                        iconColor="bg-rose-500/10"
                        textColor="text-rose-400"
                    />
                </div>
            </div>

            {/* Charts & Calendar Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Orders Chart */}
                <div className="xl:col-span-3 bg-[#12111d] rounded-[2.5rem] border border-white/5 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 opacity-50">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Order Count</span>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Up</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Card</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 h-[400px] flex items-end justify-between px-4 pb-12 gap-1.5 relative">
                        {/* Horizontal Grid lines */}
                        {[0, 20, 40, 60, 80, 100].map(val => (
                            <div key={val} className="absolute left-0 right-0 border-t border-white/[0.03] space-x-2" style={{ bottom: `${val + 10}%` }}>
                                <span className="absolute -left-1 text-[8px] font-black text-slate-700 -translate-x-full">{val}</span>
                            </div>
                        ))}

                        {(stats.chartData.length > 0 ? stats.chartData : monthlyData).map((d) => {
                            // Calculate height percentage relative to a max (e.g., 100 or the max in data)
                            const maxVal = Math.max(...(stats.chartData.length > 0 ? stats.chartData : monthlyData).map(m => Math.max(m.topup, m.card, 1)));
                            const topupHeight = (d.topup / maxVal) * 80; // Scale to 80% max height
                            const cardHeight = (d.card / maxVal) * 80;

                            return (
                                <div key={d.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <div className="flex gap-1 w-full items-end justify-center h-full pb-8">
                                        <div
                                            className="w-1/3 min-w-[6px] bg-indigo-500 rounded-lg group-hover:brightness-125 transition-all duration-500"
                                            style={{ height: `${topupHeight}%` }}
                                        />
                                        <div
                                            className="w-1/3 min-w-[6px] bg-emerald-500 rounded-lg group-hover:brightness-125 transition-all duration-500"
                                            style={{ height: `${cardHeight}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase mt-4 absolute bottom-0">{d.month.substring(0, 3)}</span>

                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                        <div className="bg-[#1b1a29] border border-white/10 rounded-xl p-3 shadow-2xl space-y-1 min-w-[100px]">
                                            <p className="text-[10px] font-black text-white">{d.month}</p>
                                            <div className="h-px bg-white/5 my-2" />
                                            <p className="text-[9px] flex justify-between gap-4">
                                                <span className="text-slate-400">Top Up:</span>
                                                <span className="text-indigo-400 font-bold">{d.topup}</span>
                                            </p>
                                            <p className="text-[9px] flex justify-between gap-4">
                                                <span className="text-slate-400">Card:</span>
                                                <span className="text-emerald-400 font-bold">{d.card}</span>
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 bg-[#1b1a29] border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Calendar Side widget */}
                <div className="bg-[#12111d] rounded-[2.5rem] border border-white/5 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-indigo-400 italic uppercase tracking-widest">{currentMonth} {currentYear}</h3>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-white/10" />
                            <div className="w-2 h-2 rounded-full bg-white/10" />
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center gap-y-6">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-[10px] font-black text-slate-500 uppercase">{day}</div>
                        ))}
                        {/* Padding for Monday start mock */}
                        <div className="text-[11px] font-bold text-slate-600 p-2 opacity-0">.</div>
                        <div className="text-[11px] font-bold text-slate-600 p-2 opacity-0">.</div>
                        <div className="text-[11px] font-bold text-slate-600 p-2 opacity-0">.</div>
                        <div className="text-[11px] font-bold text-slate-600 p-2 opacity-0">.</div>
                        <div className="text-[11px] font-bold text-slate-600 p-2 opacity-0">.</div>
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={i}
                                className={`text-[11px] font-bold p-2 transition-all cursor-pointer rounded-xl flex items-center justify-center
                                    ${i + 1 === new Date().getDate() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}
                                `}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Upcoming Schedule</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-black text-slate-200 uppercase tracking-wider">Weekly Payout Sync</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">Friday • 09:00 AM</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-black text-slate-200 uppercase tracking-wider">Game Maintenance</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">Sunday • 11:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
