import { Zap } from "lucide-react";

export function TopupPageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center hero-bg">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl border-2 border-purple-600 border-t-transparent animate-spin" />
                    <Zap className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">Loading game details...</p>
            </div>
        </div>
    );
}

interface TopupPageErrorProps {
    message: string;
    onRetry: () => void;
}

export function TopupPageError({ message, onRetry }: TopupPageErrorProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 hero-bg">
            <div className="glass-card p-10 text-center max-w-sm w-full">
                <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 mx-auto">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-white mb-2">Game Not Found</h1>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <button
                    onClick={onRetry}
                    className="btn-primary w-full justify-center py-3 rounded-xl"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
