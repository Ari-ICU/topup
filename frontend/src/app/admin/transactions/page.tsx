'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { Receipt, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

interface Transaction {
    id: string;
    status: TransactionStatus;
    paymentMethod: string;
    totalAmount: string;
    createdAt: string;
    providerRef?: string | null;
    paymentRef?: string | null;
    playerInfo: { playerId?: string; zoneId?: string; playerName?: string };
    package: {
        name: string;
        game: { name: string };
    };
    user?: { name?: string; email?: string } | null;
}

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
    const config: Record<TransactionStatus, { label: string; class: string; glow: string; icon: React.ElementType }> = {
        PENDING: { label: 'PENDING', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20', glow: 'bg-amber-500/20', icon: Clock },
        PROCESSING: { label: 'PROCESSING', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', glow: 'bg-indigo-500/20', icon: RefreshCw },
        COMPLETED: { label: 'COMPLETED', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', glow: 'bg-emerald-500/20', icon: CheckCircle },
        FAILED: { label: 'FAILED', class: 'text-red-400 bg-red-500/10 border-red-500/20', glow: 'bg-red-500/20', icon: XCircle },
        EXPIRED: { label: 'EXPIRED', class: 'text-slate-500 bg-slate-500/10 border-slate-500/20', glow: 'bg-slate-500/10', icon: Clock },
    };
    const { label, class: cls, glow, icon: Icon } = config[status] ?? config.PENDING;
    return (
        <div className="relative group/badge inline-block">
            <div className={`absolute inset-0 blur-md rounded-full transition-opacity opacity-0 group-hover/badge:opacity-100 ${glow}`} />
            <span className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${cls}`}>
                <Icon className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                {label}
            </span>
        </div>
    );
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await apiRequest<Transaction[]>('/admin/transactions');
            setTransactions(data ?? []);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
            setTransactions([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
        // 🔄 Added Real-time Polling: updates the ledger every 30 seconds
        const pollInterval = setInterval(() => {
            fetchTransactions(true);
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [fetchTransactions]);

    const [actionError, setActionError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">("ALL");

    const filteredTransactions = transactions.filter(txn => {
        const matchesQuery = !searchQuery ||
            txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.playerInfo?.playerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.playerInfo?.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.package?.game?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.paymentRef?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || txn.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    const handleUpdateStatus = async (id: string, status: TransactionStatus) => {
        setActionError(null);
        try {
            await apiRequest(`/admin/transactions/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            await fetchTransactions();
        } catch (error: any) {
            console.error('Failed to update status', error);
            setActionError(error?.message ?? 'Failed to update transaction.');
            await fetchTransactions();
        }
    };

    const handleFulfillTransaction = async (id: string) => {
        setActionError(null);
        setIsLoading(true);
        try {
            await apiRequest(`/admin/transactions/${id}/fulfill`, {
                method: 'POST',
            });
            await fetchTransactions();
        } catch (error: any) {
            console.error('Fulfillment attempt failed', error);
            setActionError(error?.message ?? 'Fulfillment failed. Connection or Supplier issue.');
            await fetchTransactions();
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setActionError(null);
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Market Operations</h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">
                        Real-time ledger of global top-up acquisitions
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchTransactions()}
                        className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                    >
                        <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync Ledger
                    </button>
                    {(searchQuery || statusFilter !== "ALL") && (
                        <button
                            onClick={handleClearFilters}
                            className="group px-6 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-[2rem] text-[10px] font-black text-red-400 uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Clear Form
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {actionError && (
                <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Fulfillment Error</p>
                        <p className="text-xs font-semibold">{actionError}</p>
                    </div>
                    <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400 text-lg leading-none">&times;</button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <RefreshCw className={`w-4 h-4 transition-colors ${searchQuery ? 'text-indigo-400' : 'text-slate-500 group-focus-within:text-indigo-400 opacity-40'}`} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search IDs, Player, Game or Payment Ref..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-700 uppercase tracking-widest"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-6 flex items-center text-slate-500 hover:text-white transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="md:col-span-4 relative group">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                    >
                        <option value="ALL" className="bg-slate-900">ALL STATUSES</option>
                        <option value="PENDING" className="bg-slate-900">PENDING</option>
                        <option value="PROCESSING" className="bg-slate-900">PROCESSING</option>
                        <option value="COMPLETED" className="bg-slate-900">COMPLETED</option>
                        <option value="FAILED" className="bg-slate-900">FAILED</option>
                        <option value="EXPIRED" className="bg-slate-900">EXPIRED</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="relative bg-white/[0.02] rounded-[2.5rem] border border-white/5 overflow-hidden">
                {isLoading ? (
                    <div className="p-24 text-center">
                        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Querying Operation Logs...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.03]">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    <th className="px-8 py-6">Operation ID</th>
                                    <th className="px-8 py-6">Target Asset</th>
                                    <th className="px-8 py-6">User Identity</th>
                                    <th className="px-8 py-6">Protocol</th>
                                    <th className="px-8 py-6">Provider Ref</th>
                                    <th className="px-8 py-6 text-right">Value</th>
                                    <th className="px-8 py-6 text-center">Current Status</th>
                                    <th className="px-8 py-6 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-24 text-center">
                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <Receipt className="w-8 h-8 text-slate-700" />
                                            </div>
                                            <p className="text-white font-black text-sm uppercase tracking-widest">No Operational Data Found</p>
                                            <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-tight">Try adjusting your search filters or status criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((txn) => (
                                        <tr key={txn.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded border border-indigo-500/10 self-start">
                                                        {txn.id.substring(0, 14)}
                                                    </span>
                                                    <span className="text-[9px] text-slate-600 font-bold mt-2 uppercase tracking-tighter">
                                                        {new Date(txn.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-white italic tracking-tight">{txn.package?.game?.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{txn.package?.name}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-slate-300 tabular-nums tracking-widest">{txn.playerInfo?.playerId ?? 'ANONYMOUS'}</p>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {txn.playerInfo?.playerName && (
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Name: {txn.playerInfo.playerName}</p>
                                                    )}
                                                    {txn.playerInfo?.zoneId && (
                                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Zone: {txn.playerInfo.zoneId}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase tracking-widest">
                                                    {txn.paymentMethod}
                                                </span>
                                            </td>
                                            {/* Provider Ref column */}
                                            <td className="px-8 py-6">
                                                {txn.providerRef ? (
                                                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 block max-w-[160px] truncate" title={txn.providerRef}>
                                                        {txn.providerRef}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">—</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-base font-black text-white tabular-nums drop-shadow-sm">${Number(txn.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <StatusBadge status={txn.status} />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 ">
                                                    {(txn.status === 'PENDING' || txn.status === 'FAILED') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleFulfillTransaction(txn.id)}
                                                                disabled={isLoading}
                                                                className="text-[9px] font-black uppercase tracking-[0.2em] bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 py-2 px-4 rounded-xl border border-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                                title="Trigger diamond delivery via provider"
                                                            >
                                                                Fulfill
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(txn.id, 'COMPLETED')}
                                                                disabled={isLoading}
                                                                className="text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 px-4 rounded-xl border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                                title="Mark as completed without delivery"
                                                            >
                                                                Seal
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(txn.id, 'FAILED')}
                                                                disabled={isLoading}
                                                                className="text-[9px] font-black uppercase tracking-[0.2em] bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-4 rounded-xl border border-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                X
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
