'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSessionExpired = searchParams.get('message') === 'session_expired';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
            const response = await fetch(`${API_URL}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                login(data.token);
            } else {
                setError(data.message || "Authentication failed");
            }
        } catch (err) {
            setError("Could not connect to the server. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#07060e]">
            {/* Background elements */}
            <div className="absolute inset-0 grid-lines opacity-10 pointer-events-none" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[150px]" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="text-center mb-10 group cursor-default">
                    <div className="inline-flex relative mb-6">
                        <div className="absolute inset-0 bg-purple-500/30 blur-2xl group-hover:bg-purple-500/50 transition-all rounded-3xl" />
                        <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-slate-900 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                            <Image src="/package-logo.png" alt="Dai-Game" fill className="object-cover p-3" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-[#07060e] shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">
                        DAI<span className="text-purple-400">-GAME</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase mt-2 opacity-60">Admin Executive Portal</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-1 pb-1 rounded-[40px] border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-10 bg-[#0d0c16]/80 backdrop-blur-xl rounded-[38px]">
                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    <Lock className="w-3.5 h-3.5 text-purple-500" />
                                    Security Password
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                    <input
                                        autoFocus
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="relative w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-lg tracking-[0.3em] focus:border-purple-500/50 focus:bg-white/[0.02] transition-all outline-none placeholder:text-slate-800 shadow-inner"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {isSessionExpired && !error && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold leading-tight animate-fade-in mb-4">
                                        <ShieldCheck className="w-5 h-5 shrink-0" />
                                        Your session has expired. Please log in again.
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-tight animate-shake mb-4">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full relative group h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-px overflow-hidden shadow-[0_20px_40px_rgba(124,58,237,0.3)] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center justify-center gap-3 text-white">
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="font-black text-xs uppercase tracking-[0.3em]">Authorize Login</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors"
                    >
                        ← Back to Public Website
                    </button>
                </div>
            </div>
        </div>
    );
}
