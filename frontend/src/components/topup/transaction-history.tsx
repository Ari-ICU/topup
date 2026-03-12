"use client";

import { useState, useEffect } from "react";
import { History, X, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { historyService, HistoryItem } from "@/lib/history";
import { useLang } from "@/context/lang-context";

export function TransactionHistory() {
    const { lang } = useLang();
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            setHistory(historyService.getAll());
        }
    }, [isOpen]);

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case "COMPLETED":
                return { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 };
            case "PENDING":
                return { color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock };
            case "PROCESSING":
                return { color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock };
            default:
                return { color: "text-red-400", bg: "bg-red-500/10", icon: AlertCircle };
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-40 h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-[0_10px_30px_rgba(124,58,237,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
                title="Transaction History"
            >
                <History className="w-6 h-6 group-hover:rotate-[-10deg] transition-transform" />
                {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold border-2 border-[#07060e]">
                        {history.length}
                    </span>
                )}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#0f0d1a] border-l border-white/5 shadow-2xl transition-transform duration-500 transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-display font-black text-white italic tracking-tight uppercase">Recent Orders</h3>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">LocalStorage Tracking</p>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                                    <Clock className="w-10 h-10 text-slate-600" />
                                </div>
                                <h4 className="text-white font-bold mb-2">No Recent Orders</h4>
                                <p className="text-sm text-slate-500 max-w-[200px]">Your last 15 purchases will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((item) => {
                                    const { color, bg, icon: StatusIcon } = getStatusStyles(item.status);
                                    return (
                                        <div key={item.id} className="group p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.08] transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">{item.gameName}</div>
                                                    <div className="text-sm font-bold text-white leading-none">{item.packageName}</div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg ${bg} ${color} text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {item.status}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <div className="text-slate-500">
                                                    {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-white">${item.amount.toFixed(2)}</div>
                                            </div>
                                            
                                            <div className="mt-3 pt-3 border-t border-white/[0.03] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="text-[9px] font-mono text-slate-600">ID: {item.id.slice(0, 12)}...</div>
                                                <button className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-1 hover:text-purple-300 transition-colors">
                                                    Details <ExternalLink className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                This history is stored <b>privately</b> on your device. Clearing your browser cache will remove these records.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
