"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, X } from "lucide-react";
import { useLang } from "@/context/lang-context";
import { t, tr } from "@/lib/i18n";
import { LangSwitcher } from "@/components/ui/lang-switcher";
import { scrollToElement } from "@/lib/utils";

export function Navbar() {
    const { lang } = useLang();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleTopUpClick = (e: React.MouseEvent) => {
        if (pathname === '/') {
            e.preventDefault();
            scrollToElement("games");
        }
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-3 lg:px-16 nav-premium nav-shimmer-top">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-4 group shrink-0 relative py-1">
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.3)] group-hover:shadow-purple-500/60 border border-purple-500/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Image
                        src="/package-logo.png"
                        alt="Dai-Game Logo"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                    <span className="font-display text-3xl font-black italic tracking-tighter text-white group-hover:text-purple-300 transition-colors leading-none">
                        DAI<span className="text-purple-400"> GAME</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1 pl-1 opacity-80 group-hover:text-purple-400/60 transition-colors">
                        TOP-UP CENTER
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-3 lg:gap-4">
                <div className="hidden sm:flex items-center gap-3 lg:gap-4">
                    <LangSwitcher />
                    <Link
                        href="/#games"
                        onClick={handleTopUpClick}
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
                <div className="fixed inset-0 top-[89px] z-40 md:hidden animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative bg-slate-900 border-b border-white/5 px-6 py-10 flex flex-col gap-8 shadow-2xl animate-slide-in-top">
                        <div className="h-px bg-white/5" />

                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-black text-slate-500 uppercase tracking-widest leading-none ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.topup.language, lang)}</span>
                                <LangSwitcher />
                            </div>
                            <Link
                                href="/#games"
                                onClick={handleTopUpClick}
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
