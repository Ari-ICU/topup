"use client";

import { GameGrid } from "@/components/game/game-grid";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Star,
  TrendingUp,
  ChevronRight,
  Gamepad2,
  Lock,
  HeadphonesIcon,
  ArrowRight,
  User,
  Package,
  AlertCircle,
  Loader2,
  Facebook,
  Send
} from "lucide-react";
import { useLang } from "@/context/lang-context";
import { t, tr } from "@/lib/i18n";
import { LangSwitcher } from "@/components/ui/lang-switcher";
import { Navbar } from "@/components/layout/navbar";
import { useState, useEffect } from "react";
import { apiRequest, getAssetUrl } from "@/lib/api";
import { Promotion } from "@/types";
import { scrollToElement } from "@/lib/utils";

export default function Home() {
  const { lang } = useLang();
  const [systemStatus, setSystemStatus] = useState<{ isReady: boolean; isTestMode: boolean; message: string } | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Fetch system health
  useEffect(() => {
    apiRequest<{ isReady: boolean; isTestMode: boolean; message: string }>('/games/status')
      .then(data => setSystemStatus(data))
      .catch(() => setSystemStatus({
        isReady: false,
        isTestMode: false,
        message: "Connection issues detected. Some services might be limited."
      }));

    // Fetch promotions
    apiRequest<Promotion[]>('/promotions')
      .then(data => setPromotions(data))
      .catch(err => console.error("Failed to fetch promotions:", err));
  }, []);

  return (
    <>
      <Navbar />

      {/* System Status Banner */}
      {systemStatus && (!systemStatus.isReady || systemStatus.isTestMode) && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-6 animate-slide-down`}>
          <div className={`flex items-center gap-4 p-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${systemStatus.isTestMode
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">
                {systemStatus.isTestMode ? "Developer Mode" : "Service Notice"}
              </p>
              <p className="text-xs font-bold leading-tight">{systemStatus.message}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex min-h-screen flex-col items-center justify-between hero-bg overflow-hidden">
        {/* ===== HERO SECTION ===== */}
        <main className="relative w-full pt-20 overflow-hidden">
          {/* Decorative background grid */}
          <div className="absolute inset-0 grid-lines opacity-50 pointer-events-none" />

          {/* Glow orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-16 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">

            {/* Left: Text content */}
            <div className="z-10 flex flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left animate-fade-in-up">
              <div className={`section-label mb-6 ${lang === 'km' ? 'khmer-text' : ''}`}>
                {/* <Zap className="w-3.5 h-3.5" /> */}
                {tr(t.hero.badge, lang)}
              </div>

              <h1 className="mb-6 font-display text-6xl font-bold tracking-tight lg:text-7xl xl:text-8xl leading-none text-white">
                {tr(t.hero.line1, lang)}
                <br />
                <span className="gradient-text text-glow-purple">{tr(t.hero.line2, lang)}</span>
                <br />
                <span className="text-4xl lg:text-5xl font-semibold text-slate-300">{tr(t.hero.line3, lang)}</span>
              </h1>

              <p className={`mb-10 max-w-lg text-base text-slate-400 leading-relaxed ${lang === 'km' ? 'khmer-text' : ''}`}>
                {lang === 'km' ? (
                  <>បង្កើនសមត្ថភាពហ្គេមភ្លាមៗ។ អ្នកលេង <strong className="text-purple-300">500K+</strong> ទូទាំងពិភពលោកជឿទុកចិត្ត។</>
                ) : (
                  <>Power up your gameplay instantly. Trusted by <strong className="text-purple-300">500K+ gamers</strong> worldwide for fast, secure top-ups with 100+ payment methods and zero hidden fees.</>
                )}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
                <a
                  href="#games"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement("games");
                  }}
                  className="btn-primary px-8 py-4 text-base rounded-xl text-center justify-center"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span className={lang === 'km' ? 'khmer-text font-semibold' : ''}>{tr(t.hero.browseGames, lang)}</span>
                </a>
                <a
                  href="#workflow"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement("workflow");
                  }}
                  className="btn-outline px-8 py-4 text-base rounded-xl justify-center flex items-center gap-2"
                >
                  <span className={lang === 'km' ? 'khmer-text font-semibold' : ''}>{tr(t.hero.howItWorks, lang)}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>

            {/* Right: Hero image + floating UI */}
            <div className="relative flex w-full justify-center lg:w-1/2 animate-float">
              {/* Orbit rings */}
              <div className="absolute w-80 h-80 rounded-full border border-purple-700/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" style={{ animationDuration: '20s' }} />
              <div className="absolute w-[420px] h-[420px] rounded-full border border-purple-700/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />

              {/* Glow under image */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-purple-600/40 blur-2xl rounded-full" />

              <div className="relative h-[420px] w-[320px] md:h-[520px] md:w-[390px]">
                <Image
                  src="/hero-image.png"
                  alt="TopUpPay gaming interface"
                  fill
                  className="object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.3))' }}
                  priority
                />
              </div>

              {/* Floating stat badges */}
              <div className="absolute top-8 -left-4 glass-card px-4 py-3 animate-fade-in-up delay-300">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className={`text-xs text-slate-400 font-medium ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.stats.activeUsers, lang)}</div>
                    <div className="text-sm font-bold text-white">500K+</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-16 -right-4 glass-card px-4 py-3 animate-fade-in-up delay-500">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className={`text-xs text-slate-400 font-medium ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.stats.deliveryTime, lang)}</div>
                    <div className={`text-sm font-bold text-white ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.stats.deliveryTimeBadge, lang)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ===== PROMOTIONS SECTION ===== */}
        {promotions.length > 0 && (
          <section className="w-full py-12 px-6 lg:px-16 relative overflow-hidden">
            <div className="relative mx-auto max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                  <Link
                    key={promo.id}
                    href={promo.linkUrl || "#"}
                    className={`relative group cursor-pointer overflow-hidden rounded-[2.5rem] border shadow-2xl transition-all duration-700 hover:-translate-y-2
                      ${promo.badgeColor === 'orange' ? 'border-orange-500/20 hover:border-orange-500/50' : 'border-purple-500/20 hover:border-purple-500/50'}
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity" />
                    <Image
                      src={getAssetUrl(promo.imageUrl)}
                      alt={promo.title}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute bottom-6 left-8 z-20">
                      {promo.badgeText && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-3 shadow-[0_5px_15px_rgba(0,0,0,0.3)]
                          ${promo.badgeColor === 'orange' ? 'bg-orange-600' : 'bg-purple-600'}
                        `}>
                          {promo.badgeColor === 'orange' ? <TrendingUp className="w-3 h-3" /> : <Zap className="w-3 h-3 fill-white" />}
                          {promo.badgeText}
                        </div>
                      )}
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none">
                        {promo.title}
                      </h3>
                      {promo.subtitle && <p className="text-slate-400 text-sm font-bold mt-2">{promo.subtitle}</p>}
                    </div>
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== GAME GRID SECTION ===== */}
        <section id="games" className="w-full section-dark py-24 px-6 lg:px-16 relative">
          <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <div className={`section-label mb-4 mx-auto w-fit ${lang === 'km' ? 'khmer-text' : ''}`}>
                <Gamepad2 className="w-3.5 h-3.5" />
                {tr(t.gamesSection.badge, lang)}
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 tracking-wide">
                {tr(t.gamesSection.title1, lang)} <span className="gradient-text">{tr(t.gamesSection.title2, lang)}</span>
              </h2>
              <p className={`text-slate-400 max-w-xl mx-auto text-base ${lang === 'km' ? 'khmer-text' : ''}`}>
                {tr(t.gamesSection.desc, lang)}
              </p>
            </div>
            <GameGrid />
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="workflow" className="w-full section-dark py-24 px-6 lg:px-16 relative">
          <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className={`section-label mb-4 mx-auto w-fit ${lang === 'km' ? 'khmer-text' : ''}`}>
                <ChevronRight className="w-3.5 h-3.5" />
                {tr(t.howItWorks.badge, lang)}
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 tracking-wide">
                {tr(t.howItWorks.title1, lang)} <span className="gradient-text">{tr(t.howItWorks.title2, lang)}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
              {/* Futuristic Connector line */}
              <div className="absolute top-[60px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent hidden md:block" />

              {t.howItWorks.steps.map((stepData, idx) => {
                const icons = [Gamepad2, User, Package, Zap];
                const Icon = icons[idx];
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'both' }}
                  >
                    <div className="step-box group flex flex-col items-center w-full">
                      <div className="step-icon-container group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Icon className="w-9 h-9 text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                        <div className="step-number-badge font-display">
                          {idx + 1}
                        </div>
                      </div>

                      <div className="text-[10px] font-black font-mono text-purple-400 tracking-[0.3em] mb-4 opacity-60 uppercase">
                        STEP 0{idx + 1}
                      </div>

                      <h3 className={`font-display text-xl md:text-2xl font-black text-white mb-4 tracking-tight leading-none ${lang === 'km' ? 'khmer-text' : ''}`}>
                        {tr(stepData.title, lang)}
                      </h3>

                      <p className={`text-slate-400 text-sm leading-relaxed ${lang === 'km' ? 'khmer-text' : ''}`}>
                        {tr(stepData.desc, lang)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="w-full border-t border-[rgba(124,58,237,0.15)] bg-[#05040b] px-6 pt-20 pb-10 lg:px-16 relative overflow-hidden">
          {/* Footer Glow */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

          <div className="mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col lg:flex-row justify-between gap-16 mb-16">
              {/* Brand Column */}
              <div className="max-w-sm">
                <Link href="/" className="flex items-center gap-4 mb-10 group w-fit">
                  <div className="relative h-16 w-16 rounded-[2rem] overflow-hidden shadow-2xl border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Image src="/package-logo.png" alt="Dai-Game" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-4xl font-black italic tracking-tighter text-white leading-none">
                      DAI<span className="text-purple-400"> GAME</span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mt-2 pl-1">
                      TOP-UP CENTER
                    </span>
                  </div>
                </Link>
                <p className={`text-sm text-slate-400 leading-relaxed mb-6 ${lang === 'km' ? 'khmer-text' : ''}`}>
                  {tr(t.footer.desc, lang)}
                </p>
                <div className="flex items-center gap-1.5 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 w-fit">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                  ))}
                  <span className="text-[11px] font-bold text-slate-300 ml-2 uppercase tracking-tighter">4.9/5 TrustScore</span>
                </div>
              </div>

              {/* Payment & Trusted Col */}
              <div className="flex flex-col items-start lg:items-end">
                <h4 className={`text-xs uppercase font-bold tracking-[0.2em] text-white/50 mb-5 ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.footer.payments, lang)}</h4>
                <div className="flex gap-3 mb-8">
                  <div className="md:h-32 md:w-32 h-24 w-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-2 group hover:border-purple-500/30 transition-all">
                    <Image src="/khqr-v2.png" alt="KHQR" width={64} height={64} className="object-contain w-full h-full opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="md:h-32 md:w-32 h-24 w-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-2 group hover:border-purple-500/30 transition-all">
                    <Image src="/aba.png" alt="ABA" width={64} height={64} className="object-contain w-full h-full opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-10" />

            <div className="flex flex-col items-center justify-between gap-8 md:flex-row pb-12">
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/20 hover:border-blue-600/40 transition-all group" title="Facebook">
                  <Facebook className="w-5 h-5 transition-transform group-hover:scale-110" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group" title="TikTok">
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.617a8.171 8.171 0 0 0 4.773 1.574V6.686z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-sky-500/20 hover:border-sky-500/40 transition-all group" title="Telegram">
                  <Send className="w-5 h-5 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
