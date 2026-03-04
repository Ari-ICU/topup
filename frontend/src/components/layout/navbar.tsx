"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useLang } from "@/context/lang-context";
import { t, tr } from "@/lib/i18n";
import { LangSwitcher } from "@/components/ui/lang-switcher";

export function Navbar() {
    const { lang } = useLang();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 lg:px-16 glass border-b border-[rgba(124,58,237,0.2)]">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-purple-500/50 border border-purple-500/30 transition-all duration-300">
                    <Image
                        src="/package-logo.png"
                        alt="Dai-Game"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <span className="font-display text-2xl font-black italic tracking-tighter text-white group-hover:text-purple-300 transition-colors">
                    DAI<span className="text-purple-400">-GAME</span>
                </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
                <Link href="/#games" className={`nav-link ${lang === 'km' ? 'khmer-text font-semibold' : ''}`}>{tr(t.nav.games, lang)}</Link>
                <Link href="/#benefits" className={`nav-link ${lang === 'km' ? 'khmer-text font-semibold' : ''}`}>{tr(t.nav.whyUs, lang)}</Link>
                <Link href="/#testimonials" className={`nav-link ${lang === 'km' ? 'khmer-text font-semibold' : ''}`}>{tr(t.nav.reviews, lang)}</Link>
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
                <div className="hidden sm:flex items-center gap-3 lg:gap-4">
                    <LangSwitcher />
                    <button className={`text-sm font-semibold text-purple-300 hover:text-purple-100 transition-colors px-4 py-2 rounded-lg hover:bg-purple-900/20 ${lang === 'km' ? 'khmer-text' : ''}`}>
                        {tr(t.nav.signIn, lang)}
                    </button>
                    <Link
                        href="/#games"
                        className="btn-primary text-sm px-5 py-2.5 rounded-lg"
                    >
                        <Zap className="w-4 h-4" />
                        <span className={lang === 'km' ? 'khmer-text' : ''}>{tr(t.nav.topUpNow, lang)}</span>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 top-[73px] z-40 md:hidden animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative bg-slate-900 border-b border-white/5 px-6 py-10 flex flex-col gap-8 shadow-2xl animate-slide-in-top">
                        <div className="flex flex-col gap-6">
                            <Link href="/#games" onClick={() => setIsMenuOpen(false)} className={`text-md font-black text-white italic tracking-tighter ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.nav.games, lang)}</Link>
                            <Link href="/#benefits" onClick={() => setIsMenuOpen(false)} className={`text-md font-black text-white italic tracking-tighter ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.nav.whyUs, lang)}</Link>
                            <Link href="/#testimonials" onClick={() => setIsMenuOpen(false)} className={`text-md font-black text-white italic tracking-tighter ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.nav.reviews, lang)}</Link>
                        </div>

                        <div className="h-px bg-white/5" />

                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-black text-slate-500 uppercase tracking-widest leading-none ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.topup.language, lang)}</span>
                                <LangSwitcher />
                            </div>
                            <button className={`w-full py-2 rounded-2xl bg-white/5 text-white font-bold text-md border border-white/10 ${lang === 'km' ? 'khmer-text' : ''}`}>
                                {tr(t.nav.signIn, lang)}
                            </button>
                            <Link
                                href="/#games"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                <span className={`text-md font-black uppercase tracking-widest ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.nav.topUpNow, lang)}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
