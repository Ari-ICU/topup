"use client";

import Link from "next/link";
import { Gamepad2, Home, Ghost, ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center hero-bg overflow-hidden px-6">
            {/* Decorative background effects */}
            <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />

            {/* Glow orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
                {/* Animated Icon */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-150 animate-pulse-glow" />
                    <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-900/50 border border-purple-400/30 group-hover:rotate-12 transition-transform duration-500">
                        <Ghost className="w-12 h-12 text-white" />
                    </div>

                    {/* Floating small icons */}
                    <Gamepad2 className="absolute -top-4 -right-4 w-8 h-8 text-cyan-400 opacity-50 animate-bounce-slow" />
                    <div className="absolute -bottom-2 -left-6 w-3 h-3 rounded-full bg-amber-400 animate-ping-slow" />
                </div>

                {/* 404 Text */}
                <div className="section-label mb-6 mx-auto w-fit">
                    <span className="text-white font-mono tracking-widest">{t.notFound.badge}</span>
                </div>

                <h1 className="font-display text-7xl md:text-9xl font-black mb-4 tracking-tighter text-white">
                    <span className="gradient-text text-glow-purple italic px-4">404</span>
                </h1>

                <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-6 font-display italic tracking-wide">
                    {t.notFound.title}
                </h2>

                <p className="text-slate-400 max-w-md mx-auto mb-12 leading-relaxed text-lg">
                    {t.notFound.desc}
                </p>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Link
                        href="/"
                        className="btn-primary px-8 py-4 rounded-xl flex items-center gap-2 group shadow-xl shadow-purple-900/40"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">
                            {t.notFound.backHome}
                        </span>
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="btn-outline px-8 py-4 rounded-xl flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">
                            Go Back
                        </span>
                    </button>
                </div>
            </div>

            {/* Decorative Orbit Rings */}
            <div className="absolute w-[800px] h-[800px] rounded-full border border-purple-500/5 pointer-events-none animate-spin-slow opacity-20" style={{ animationDuration: '60s' }} />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/5 pointer-events-none animate-spin-slow opacity-20" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
        </div>
    );
}
