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
  Package,
  AlertCircle,
  Loader2
} from "lucide-react";
import { ReviewList } from "@/components/review/review-list";
import { ReviewForm } from "@/components/review/review-form";
import { useLang } from "@/context/lang-context";
import { t, tr } from "@/lib/i18n";
import { LangSwitcher } from "@/components/ui/lang-switcher";
import { Navbar } from "@/components/layout/navbar";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

export default function Home() {
  const { lang } = useLang();
  const [systemStatus, setSystemStatus] = useState<{ isReady: boolean; isTestMode: boolean; message: string } | null>(null);

  // Fetch system health
  useEffect(() => {
    apiRequest<{ isReady: boolean; isTestMode: boolean; message: string }>('/games/status')
      .then(data => setSystemStatus(data))
      .catch(() => setSystemStatus({
        isReady: false,
        isTestMode: false,
        message: "Connection issues detected. Some services might be limited."
      }));
  }, []);

  return (
    <>
      <Navbar />

      {/* ── System Status Banner ────────────────────────────────────────── */}
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
                <Zap className="w-3.5 h-3.5" />
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
                  className="btn-primary px-8 py-4 text-base rounded-xl text-center justify-center"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span className={lang === 'km' ? 'khmer-text font-semibold' : ''}>{tr(t.hero.browseGames, lang)}</span>
                </a>
                <a href="#benefits" className="btn-outline px-8 py-4 text-base rounded-xl justify-center flex items-center gap-2">
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

          {/* ===== STATS BANNER ===== */}
          <div className="relative w-full border-y border-[rgba(124,58,237,0.15)] py-8 px-6 lg:px-16">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-cyan-900/10" />
            <div className="relative mx-auto max-w-7xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "500K+", label: tr(t.stats.happyPlayers, lang), color: "text-purple-400" },
                  { value: "2M+", label: tr(t.stats.transactionsDone, lang), color: "text-cyan-400" },
                  { value: "50+", label: tr(t.stats.gamesAvailable, lang), color: "text-amber-400" },
                  { value: "<5s", label: tr(t.stats.deliveryTime, lang), color: "text-emerald-400" },
                ].map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <div className={`text-2xl lg:text-3xl font-display font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className={`text-xs text-slate-500 uppercase tracking-wider font-semibold ${lang === 'km' ? 'khmer-text' : ''}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

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

        {/* ===== BENEFITS / WHY US SECTION ===== */}
        <section className="w-full section-darker py-24 px-6 lg:px-16 relative">
          <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className={`section-label mb-4 mx-auto w-fit ${lang === 'km' ? 'khmer-text' : ''}`}>
                <Shield className="w-3.5 h-3.5" />
                {tr(t.benefits.badge, lang)}
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 tracking-wide">
                {tr(t.benefits.title1, lang)} <span className="gradient-text">{tr(t.benefits.title2, lang)}</span> {tr(t.benefits.title3, lang)}
              </h2>
              <p className={`text-slate-400 max-w-2xl mx-auto ${lang === 'km' ? 'khmer-text text-base' : ''}`}>
                {tr(t.benefits.desc, lang)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: tr(t.benefits.cards.fast.title, lang),
                  description: tr(t.benefits.cards.fast.desc, lang),
                  badge: tr(t.benefits.cards.fast.badge, lang),
                  badgeClass: "badge-gold",
                  iconBg: "from-amber-500 to-orange-600",
                },
                {
                  icon: Lock,
                  title: tr(t.benefits.cards.secure.title, lang),
                  description: tr(t.benefits.cards.secure.desc, lang),
                  badge: tr(t.benefits.cards.secure.badge, lang),
                  badgeClass: "badge-cyan",
                  iconBg: "from-cyan-500 to-blue-600",
                },
                {
                  icon: HeadphonesIcon,
                  title: tr(t.benefits.cards.support.title, lang),
                  description: tr(t.benefits.cards.support.desc, lang),
                  badge: tr(t.benefits.cards.support.badge, lang),
                  badgeClass: "badge-success",
                  iconBg: "from-emerald-500 to-teal-600",
                },
                {
                  icon: TrendingUp,
                  title: tr(t.benefits.cards.prices.title, lang),
                  description: tr(t.benefits.cards.prices.desc, lang),
                  badge: tr(t.benefits.cards.prices.badge, lang),
                  badgeClass: "badge-gold",
                  iconBg: "from-pink-500 to-rose-600",
                },
                {
                  icon: Clock,
                  title: tr(t.benefits.cards.always.title, lang),
                  description: tr(t.benefits.cards.always.desc, lang),
                  badge: tr(t.benefits.cards.always.badge, lang),
                  badgeClass: "badge-cyan",
                  iconBg: "from-violet-500 to-purple-600",
                },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="glass-card p-7 group hover:-translate-y-1 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/30"
                >
                  <div className={`mb-5 inline-flex h-13 w-13 items-center justify-center rounded-xl bg-gradient-to-br ${benefit.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    style={{ height: '52px', width: '52px' }}>
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`badge ${benefit.badgeClass} mb-4 ${lang === 'km' ? 'khmer-text' : ''}`}>{benefit.badge}</div>
                  <h3 className={`mb-3 ${lang === 'km' ? 'khmer-text font-bold text-lg' : 'font-display text-xl'} font-bold text-white tracking-wide`}>{benefit.title}</h3>
                  <p className={`text-slate-400 text-sm leading-relaxed ${lang === 'km' ? 'khmer-text' : ''}`}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="benefits" className="w-full section-dark py-24 px-6 lg:px-16 relative">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector line */}
              <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-purple-600/40 to-transparent hidden md:block" />

              {t.howItWorks.steps.map((stepData, idx) => {
                const icons = [Gamepad2, Users, Package, Zap];
                const Icon = icons[idx];
                return (
                  <div key={idx} className="flex flex-col items-center text-center relative">
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-900/50 animate-pulse-glow">
                        <Icon className="w-9 h-9 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-black text-white">{idx + 1}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-purple-500 tracking-widest mb-2 uppercase">0{idx + 1}</div>
                    <h3 className={`font-display text-xl font-bold text-white mb-3 tracking-wide ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(stepData.title, lang)}</h3>
                    <p className={`text-slate-400 text-sm leading-relaxed max-w-xs ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(stepData.desc, lang)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section id="testimonials" className="w-full section-darker py-24 px-6 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className={`section-label mb-4 mx-auto w-fit ${lang === 'km' ? 'khmer-text' : ''}`}>
                <Star className="w-3.5 h-3.5 fill-current" />
                {tr(t.reviews.badge, lang)}
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 tracking-wide text-glow-purple">
                {tr(t.reviews.title1, lang)} <span className="gradient-text">{tr(t.reviews.title2, lang)}</span> {tr(t.reviews.title3, lang)}
              </h2>
              <p className={`text-slate-400 max-w-xl mx-auto mb-12 ${lang === 'km' ? 'khmer-text' : ''}`}>
                {tr(t.reviews.desc, lang)}
              </p>

              <div className="max-w-3xl mx-auto mb-16">
                <ReviewForm />
              </div>

              <ReviewList />
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="w-full py-32 px-6 lg:px-16 relative overflow-hidden group">
          {/* Deep background with multi-layered gradients */}
          <div className="absolute inset-0 bg-[#07060e]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.25)_0%,transparent_60%)] opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(6,182,212,0.15)_0%,transparent_50%)] opacity-50" />

          {/* Cyber grid with mask */}
          <div className="absolute inset-0 grid-lines opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none" />

          {/* Animated glowing lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.3)]" />

          {/* Large Decorative Glow Orbs */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-purple-600/15 transition-all duration-1000" />
          <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-600/15 transition-all duration-1000" />

          <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Animated label */}
            <div className={`section-label mb-8 mx-auto w-fit animate-bounce-slow ${lang === 'km' ? 'khmer-text' : ''}`}>
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="text-white">{tr(t.cta.badge, lang)}</span>
            </div>

            <h2 className="font-display text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase overflow-hidden">
              <span className={`block animate-fade-in-up ${lang === 'km' ? 'khmer-text leading-tight' : ''}`}>{tr(t.cta.title1, lang)}</span>
              <span className={`gradient-text drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] block animate-fade-in-up delay-100 ${lang === 'km' ? 'mt-4 khmer-text leading-tight' : 'mt-2'}`}>
                {tr(t.cta.title2, lang)}
              </span>
            </h2>

            <p className={`text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200 ${lang === 'km' ? 'khmer-text' : ''}`}>
              {tr(t.cta.desc, lang)}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto animate-fade-in-up delay-300">
              <a
                href="#games"
                className="btn-primary px-12 py-5 text-lg rounded-2xl justify-center shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 group/btn"
              >
                <Gamepad2 className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                <span className={lang === 'km' ? 'khmer-text font-bold' : ''}>{tr(t.cta.browseAll, lang)}</span>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </a>
              <a
                href="#benefits"
                className="btn-outline px-12 py-5 text-lg rounded-2xl justify-center backdrop-blur-sm border-purple-500/20 hover:border-purple-500/60 hover:bg-purple-500/5 group/btn"
              >
                <span className={lang === 'km' ? 'khmer-text font-bold' : ''}>{tr(t.cta.learnMore, lang)}</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Platform availability indicators */}
            <div className="mt-20 flex items-center justify-center gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className={`text-[10px] uppercase font-bold tracking-[0.25em] text-slate-300 ${lang === 'km' ? 'khmer-text text-[12px]' : ''}`}>{tr(t.stats.platforms.ios, lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className={`text-[10px] uppercase font-bold tracking-[0.25em] text-slate-300 ${lang === 'km' ? 'khmer-text text-[12px]' : ''}`}>{tr(t.stats.platforms.android, lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className={`text-[10px] uppercase font-bold tracking-[0.25em] text-slate-300 ${lang === 'km' ? 'khmer-text text-[12px]' : ''}`}>{tr(t.stats.platforms.pc, lang)}</span>
              </div>
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
                <Link href="/" className="flex items-center gap-3 mb-6 group w-fit">
                  <div className="relative h-12 w-12 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30">
                    <Image src="/package-logo.png" alt="Dai-Game" fill className="object-cover" />
                  </div>
                  <span className="font-display text-2xl font-black italic tracking-tighter text-white">
                    DAI<span className="text-purple-400">-GAME</span>
                  </span>
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

              {/* Links Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-12 lg:gap-24">
                <div className="flex flex-col gap-4">
                  <h4 className={`text-xs uppercase font-bold tracking-[0.2em] text-white/50 mb-2 ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.footer.platform, lang)}</h4>
                  <a href="#games" className={`text-sm text-slate-400 hover:text-purple-400 transition-colors ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.footer.gamesList, lang)}</a>
                  <a href="#benefits" className={`text-sm text-slate-400 hover:text-purple-400 transition-colors ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.footer.howWorks, lang)}</a>
                </div>
              </div>

              {/* Payment & Trusted Col */}
              <div className="flex flex-col items-start lg:items-end">
                <h4 className={`text-xs uppercase font-bold tracking-[0.2em] text-white/50 mb-5 ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.footer.payments, lang)}</h4>
                <div className="flex gap-3 mb-8">
                  <div className="h-10 w-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-2 group hover:border-purple-500/30 transition-all">
                    <Image src="/khqr.png" alt="KHQR" width={32} height={32} className="object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-10 w-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-2 group hover:border-purple-500/30 transition-all">
                    <Image src="/aba.png" alt="ABA" width={32} height={32} className="object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-10" />

            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <p className="text-xs text-slate-500">
                © 2025 TopUp<span className="text-purple-500 font-bold">Pay</span>. <span className={lang === 'km' ? 'khmer-text' : ''}>{tr(t.footer.copyright, lang)}</span>
              </p>
              <div className="flex gap-8">
                {["Twitter", "Discord", "Telegram", "Instagram"].map((social) => (
                  <a key={social} href="#" className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] font-black">
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
