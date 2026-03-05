'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Copy, Key, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminApiKeyPage() {
    const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; submessage: string } | null>(null);

    const fetchKeys = async () => {
        try {
            const res = await apiRequest<{ publicKey: string; secretKey: string }>('/admin/api-keys');
            setKeys(res);
        } catch (error) {
            console.error('Failed to fetch API keys', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = () => {
        setShowConfirmModal(true);
    };

    const confirmGenerate = async () => {
        setShowConfirmModal(false);
        setIsGenerating(true);
        try {
            const res = await apiRequest<{ publicKey: string; secretKey: string }>('/admin/api-keys/generate', {
                method: 'POST'
            });
            setKeys(res);
            showToast("Success", "New API keys generated!");
        } catch (error: any) {
            showToast("Error", error.message || "Failed to generate keys");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (text: string, label: string) => {
        if (!text || text.includes('...') || text === "") {
            showToast("Error", `Empty key! Please click "Generate New Key" first to create your API credentials.`);
            return;
        }

        try {
            // Modern Clipboard API
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                showToast("Copied Success!", `${label} has been copied to your clipboard.`);
            } else {
                // Fallback for insecure contexts
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    showToast("Copied Success!", `${label} has been copied to your clipboard.`);
                } else {
                    throw new Error('Fallback copy failed');
                }
            }
        } catch (err) {
            console.error('Copy failed:', err);
            showToast("Error", "Unable to copy. Please try manually selecting the text or using a secure HTTPS connection.");
        }
    };

    const showToast = (message: string, submessage: string) => {
        setToast({ message, submessage });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in text-slate-200 relative">
            {/* Breadcrumb */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-white tracking-tight italic">Api Key</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Home &gt; Api Key</p>
            </div>

            {/* Main Content Area */}
            <div className="bg-[#12111d] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Key className="w-64 h-64 text-indigo-500" />
                </div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h2 className="text-xl font-black text-white italic tracking-widest uppercase">API Integration</h2>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Generate New Key
                    </button>
                </div>

                <div className="space-y-8 relative z-10">
                    {/* Public Key Field */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Public Key:</label>
                        <div className="flex group">
                            <div className="flex-1 bg-[#0a0910] border border-white/5 rounded-2xl p-4 font-mono text-sm text-slate-300 flex items-center overflow-hidden border-r-0 rounded-r-none group-focus-within:border-indigo-500/50 transition-colors">
                                <span className="truncate">{keys?.publicKey || "pk_................................................"}</span>
                            </div>
                            <button
                                onClick={() => handleCopy(keys?.publicKey || "", "Public Key")}
                                className="bg-[#1b1a29] border border-white/5 border-l-0 rounded-2xl p-4 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all flex items-center gap-3 rounded-l-none font-black text-[10px] uppercase tracking-widest active:bg-indigo-500/10 active:scale-95 transition-all"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Secret Key Field */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-rose-500/70">Secret Key (Keep this secure!):</label>
                        <div className="flex group">
                            <div className="flex-1 bg-[#0a0910] border border-white/5 rounded-2xl p-4 font-mono text-sm text-slate-300 flex items-center overflow-hidden border-r-0 rounded-r-none group-focus-within:border-indigo-500/50 transition-colors">
                                <span className="truncate">
                                    {showSecret ? (keys?.secretKey || "sk_................................................") : "••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                                </span>
                                {keys?.secretKey && (
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
                                    >
                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => handleCopy(keys?.secretKey || "", "Secret Key")}
                                className="bg-[#1b1a29] border border-white/5 border-l-0 rounded-2xl p-4 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all flex items-center gap-3 rounded-l-none font-black text-[10px] uppercase tracking-widest active:bg-indigo-500/10 active:scale-95 transition-all"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                        <Key className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Security Warning</p>
                        <p className="text-xs text-rose-500/70 font-medium mt-1 leading-relaxed">
                            Your API secret key is a powerful credential. If you suspect it has been compromised, generate a new one immediately.
                            Do not share your secret key in customer service tickets or public forums.
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Toast Notification */}
            {toast && (
                <div className="fixed top-8 right-8 z-[110] animate-toast-in">
                    <div className={`${toast.message === 'Error' ? 'bg-rose-600' : 'bg-emerald-600'} rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 text-white min-w-[320px] border border-white/10 glow-purple`}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            {toast.message === 'Error' ? <Key className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black uppercase tracking-widest">{toast.message}</p>
                            <p className="text-[10px] font-bold opacity-80 leading-relaxed">{toast.submessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#07060e]/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowConfirmModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-[#12111d] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in overflow-hidden">
                        {/* Decorative Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl -ml-10 -mb-10" />

                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-rose-500/5">
                                <RefreshCw className="w-10 h-10 text-rose-500 animate-spin-slow" />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-wider">Regenerate Keys?</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                    Caution: Generating new keys will <span className="text-rose-400 font-bold underline decoration-rose-400/30">invalidate</span> your current ones immediately.
                                    Any external apps or services using the old keys will <span className="text-white font-bold">break</span> instantly.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-6">
                                <button
                                    onClick={confirmGenerate}
                                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-rose-600/20"
                                >
                                    Confirm & Generate New
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full py-4 bg-[#1b1a29] hover:bg-[#252336] border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
