"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft, Zap, Shield, Lock, HeadphonesIcon,
    CheckCircle, CreditCard, User, Hash, Loader2, AlertCircle, Check,
    Gamepad2, Package, ChevronRight
} from "lucide-react";

import { apiRequest, getAssetUrl } from "@/lib/api";
import { useGame, useVerifyAccount, useTransaction } from "@/hooks/topup";
import { PAYMENT_METHODS } from "@/constants/topup";
import { TopupPageLoader, TopupPageError } from "@/components/topup/page-states";
import { KhqrModal } from "@/components/topup/khqr-modal";
import { useLang } from "@/context/lang-context";
import { t, tr, Lang } from "@/lib/i18n";
import { LangSwitcher } from "@/components/ui/lang-switcher";

// ─── Step Header ─────────────────────────────────────────────────────────────
function StepHeader({ step, title, subtitle, lang }: { step: number; title: string; subtitle: string; lang: Lang }) {
    return (
        <div className="flex items-center gap-5 mb-8">
            <div className="relative group/step">
                {/* Outter Ring */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-lg group-hover/step:translate-y-1 transition-transform" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f0d1a] border border-white/5 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 opacity-90" />
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
                    <span className="relative z-10 text-white font-black font-display text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] italic">{step}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-4 border-[#07060e] flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                </div>
            </div>
            <div>
                <h2 className={`font-display text-lg md:text-2xl font-black text-white tracking-tight uppercase italic ${lang === 'km' ? 'khmer-text' : ''}`}>
                    {title}
                </h2>
                <p className={`text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 opacity-70 ${lang === 'km' ? 'khmer-text' : ''}`}>
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

// ─── Verify Banner ────────────────────────────────────────────────────────────
function VerifyBanner({
    status, verifiedName, verifyError, lang
}: {
    status: "idle" | "success" | "format-ok" | "error";
    verifiedName: string | null;
    verifyError: string | null;
    lang: Lang;
}) {
    if (status === "idle") return null;

    const config = {
        success: { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300", Icon: CheckCircle },
        "format-ok": { bg: "bg-amber-500/10 border-amber-500/40 text-amber-300", Icon: Shield },
        error: { bg: "bg-red-500/10 border-red-500/30 text-red-300", Icon: Zap },
    }[status];

    const { bg, Icon } = config;

    return (
        <div className={`mt-5 flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold animate-fade-in-up ${bg}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                {status === "success" && (
                    <>
                        <div className="font-bold text-white tracking-tight">{verifiedName}</div>
                        <div className={`text-xs font-normal mt-0.5 text-emerald-400/80 ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.topup.verifySuccess, lang)}</div>
                    </>
                )}
                {status === "format-ok" && (
                    <>
                        <div className={`text-amber-200 font-bold ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.topup.verifyFormat, lang)}</div>
                        <div className={`text-xs text-amber-500 font-normal mt-0.5 ${lang === 'km' ? 'khmer-text' : ''}`}>
                            {tr(t.topup.verifyFormatHint, lang)}
                        </div>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div className={`text-red-200 font-bold ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.topup.verifyInvalid, lang)}</div>
                        <div className={`text-xs text-red-400 font-normal mt-0.5 ${lang === 'km' ? 'khmer-text' : ''}`}>{verifyError}</div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPackageName(name: string) {
    const copyMatch = name.match(/(?:\s*\(Copy\))+$/i);
    if (!copyMatch) return name;
    const count = (copyMatch[0].match(/\(Copy\)/gi) || []).length;
    return name.replace(/(?:\s*\(Copy\))+$/i, ` (Copy) x${count}`);
}

// ─── How To Use Section ────────────────────────────────────────────────────────
function HowToUseSection({ lang }: { lang: Lang }) {
    const steps = [
        {
            icon: Gamepad2,
            step: "01",
            title: lang === 'km' ? 'ជ្រើសហ្គេម' : 'Choose Game',
            desc: lang === 'km'
                ? 'ស្វែងរកហ្គេមដែលមានក្នុងបញ្ជីជាង ៥០ ប្រភេទ និងជ្រើសរើសហ្គេមដែលអ្នកចង់បាន។'
                : 'Browse our list of over 50 games and select your desired game.',
        },
        {
            icon: User,
            step: "02",
            title: lang === 'km' ? 'បញ្ចូល Player ID' : 'Enter Player ID',
            desc: lang === 'km'
                ? 'បញ្ចូល Player ID និង Zone ID របស់អ្នកដើម្បីត្រៀមទទួលប្រាក់។'
                : 'Enter your Player ID and Zone ID to prepare for receiving top-up.',
        },
        {
            icon: Package,
            step: "03",
            title: lang === 'km' ? 'ជ្រើសកញ្ចប់' : 'Choose Package',
            desc: lang === 'km'
                ? 'ពិនិត្យមើលតម្លៃកញ្ចប់បញ្ចូលហ្គេម និងជ្រើសរើសកញ្ចប់ដែលអ្នកចង់បំពេញ។'
                : 'Review the top-up package prices and select the one you want.',
        },
        {
            icon: Zap,
            step: "04",
            title: lang === 'km' ? 'បង់ & ទទួលភ្លាម' : 'Pay & Receive',
            desc: lang === 'km'
                ? 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់ដែលអ្នកចូលចិត្តបញ្ជាក់ ហើយទទួលបានប្រាក់របស់អ្នកភ្លាមៗ។'
                : 'Choose your preferred payment method, confirm, and receive credits instantly.',
        }
    ];

    return (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 mb-24 relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[10px] md:text-xs font-bold text-slate-300 tracking-wider mb-4">
                    <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                    <span>{lang === 'km' ? 'ដំណើរការងាយស្រួល' : 'SIMPLE PROCESS'}</span>
                </div>
                <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-center ${lang === 'km' ? 'khmer-text !leading-[1.4]' : ''}`}>
                    <span className="text-white">{lang === 'km' ? 'របៀប ' : 'HOW TO '}</span>
                    <span className="text-purple-400">
                        {lang === 'km' ? 'ប្រើប្រាស់' : 'USE'}
                    </span>
                </h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-[#0f0d1a] border border-white/5 hover:border-purple-500/20 hover:bg-[#131121] transition-colors duration-300">

                        {/* Icon Container with Badge */}
                        <div className="relative mb-8 mt-2">
                            <div className="w-[72px] h-[72px] bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                                <item.icon className="w-8 h-8 text-white stroke-2" />
                            </div>
                            {/* Orange Badge */}
                            <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-md border-2 border-[#0f0d1a]">
                                {idx + 1}
                            </div>
                        </div>

                        {/* Text */}
                        <div className="text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-4">
                            STEP {item.step}
                        </div>
                        <h3 className={`text-lg font-bold text-white mb-3 ${lang === 'km' ? 'khmer-text' : ''}`}>
                            {item.title}
                        </h3>
                        <p className={`text-sm text-slate-400 leading-relaxed ${lang === 'km' ? 'khmer-text' : ''}`}>
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TopupPage() {
    const { lang } = useLang();
    const { gameId } = useParams();

    // Form state
    const [userId, setUserId] = useState("");
    const [zoneId, setZoneId] = useState("");
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string | null>("bakong");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [systemStatus, setSystemStatus] = useState<{ isReady: boolean; isTestMode: boolean; message: string } | null>(null);

    // Custom hooks
    const { game, error: gameError, loading: gameLoading } = useGame(gameId);
    const { isVerifying, verifyStatus, verifiedName, verifyError, verify, reset: resetVerify } = useVerifyAccount();
    const { isLoading, status, error: txError, paymentData, submit, reset: resetTx, setPaymentData, setStatus } = useTransaction();

    // Fetch system health
    useEffect(() => {
        apiRequest<{ isReady: boolean; isTestMode: boolean; message: string }>('/games/status')
            .then(data => setSystemStatus(data))
            .catch(() => setSystemStatus({
                isReady: false,
                isTestMode: false,
                message: "Connection lost. Using local fallback data. Transactions may be delayed."
            }));
    }, []);

    // Derived values
    const isReadyForOrders = systemStatus?.isReady || systemStatus?.isTestMode;
    const selectedPkg = game?.packages.find((p) => p.id === selectedPackage);

    // Flowchart Enforcer: Must be verified to pay
    const isVerified = verifyStatus === "success" || verifyStatus === "format-ok";

    // Sold-out helper: a package is sold out when globalStockDiamonds is 0
    // (or less than the package amount). -1 means unlimited stock.
    const globalStock = game?.globalStockDiamonds ?? 0;
    const isPackageSoldOut = (pkgAmount: number) =>
        globalStock !== -1 && globalStock < pkgAmount;

    const isFormFilled = !!(userId && selectedPackage && selectedPayment && (!game?.inputConfig?.zoneId || zoneId)) && isReadyForOrders;
    const isFormValid = isFormFilled && isVerified && agreedToTerms;

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handlePlayerIdChange = (value: string) => {
        setUserId(value);
        resetVerify();
    };

    const handleVerify = () => {
        if (!game) return;
        verify(game.slug, userId, zoneId);
    };

    const handleSubmit = () => {
        if (!selectedPackage || !selectedPayment) return;
        submit({
            packageId: selectedPackage,
            userId,
            zoneId,
            paymentMethod: selectedPayment,
            playerName: verifiedName || undefined
        });
    };

    const handleNewTransaction = () => {
        resetTx();
        setUserId("");
        setSelectedPackage(null);
    };

    if (gameLoading) return <TopupPageLoader />;
    if (gameError || !game) return <TopupPageError message={gameError ?? "Unknown error"} onRetry={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-[#07060e] relative text-white selection:bg-purple-500/30">
            <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />

            {/* ── Navbar ────────────────────────────────────────────────────────── */}
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

                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="hidden md:flex items-center gap-2 text-sm font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {tr(t.nav.backToGames, lang)}
                    </Link>
                    <LangSwitcher />
                </div>
            </nav>

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

            {/* ── Hero Banner ───────────────────────────────────────────────────── */}
            <header className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] aspect-video bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2)_0%,transparent_70%)] blur-3xl animate-pulse-glow" />
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[120px] animate-float" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-10 lg:gap-14">
                        {/* Game Icon */}
                        <div className="relative group flex-shrink-0">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl group-hover:bg-purple-500/40 transition-colors" />
                            <div className="relative w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-[2.5rem] md:rounded-[3rem] bg-slate-900/60 backdrop-blur-xl border-2 border-white/10 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] p-4 md:p-5 rotate-1 group-hover:rotate-0 transition-all duration-700">
                                <Image
                                    src={getAssetUrl(game.iconUrl) || "/hero-image.png"}
                                    alt={game.name}
                                    fill
                                    className="object-contain p-3 md:p-4 transition-transform duration-700 group-hover:scale-110"
                                    unoptimized={true}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Game Meta */}
                        <div className="flex-1 min-w-0 text-center md:text-left space-y-4 md:space-y-5">
                            <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] md:text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] ${lang === 'km' ? 'khmer-text text-[12px]' : ''}`}>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                {tr(t.topup.instantEnabled, lang)}
                            </div>
                            <h1 className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-[0.9] select-none break-words">
                                {game.name.toUpperCase()}
                            </h1>

                            {/* ── Arrow Trust Badges (like screenshot) ── */}
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2">
                                {/* Instant Delivery badge */}
                                <div className="relative flex items-center">
                                    <div className="flex items-center gap-2 bg-[#22c55e] px-5 py-2 pr-7 -skew-x-12 shadow-[0_4px_20px_rgba(34,197,94,0.4)]">
                                        <Zap className="w-4 h-4 text-black skew-x-12 fill-black shrink-0" />
                                        <span className="font-black text-[11px] text-black uppercase tracking-widest skew-x-12 whitespace-nowrap">
                                            {lang === 'km' ? 'ចែកជូនភ្លាមៗ' : 'INSTANT DELIVERY'}
                                        </span>
                                    </div>
                                    {/* Arrow tip */}
                                    <div className="w-0 h-0 border-t-[19px] border-b-[19px] border-l-[14px] border-t-transparent border-b-transparent border-l-[#22c55e] -ml-0.5" />
                                </div>
                                {/* Official Distributor badge */}
                                <div className="relative flex items-center">
                                    <div className="flex items-center gap-2 bg-[#22c55e] px-5 py-2 pr-7 -skew-x-12 shadow-[0_4px_20px_rgba(34,197,94,0.4)]">
                                        <Shield className="w-4 h-4 text-black skew-x-12 shrink-0" />
                                        <span className="font-black text-[11px] text-black uppercase tracking-widest skew-x-12 whitespace-nowrap">
                                            {lang === 'km' ? 'អ្នកចែកចាយផ្លូវការ' : 'OFFICIAL DISTRIBUTOR'}
                                        </span>
                                    </div>
                                    <div className="w-0 h-0 border-t-[19px] border-b-[19px] border-l-[14px] border-t-transparent border-b-transparent border-l-[#22c55e] -ml-0.5" />
                                </div>
                            </div>

                            {/* ── Game Description ── */}
                            <p className={`max-w-xl text-sm md:text-base text-slate-300 leading-relaxed font-medium ${lang === 'km' ? 'khmer-text' : ''}`}>
                                {lang === 'km' ? (
                                    <>
                                        វិញ្ញាបនប័ត្រ <strong className="text-white font-black">{game.name}</strong> ត្រូវតែទទួលបានភ្លាមៗ!
                                        {' '}គ្រាន់តែបញ្ចូល <strong className="text-[#22c55e]">ID</strong> របស់អ្នក, ជ្រើសរើសកញ្ចប់ ហើយបង់ — ចែកទៅប្រាក់ភ្លាមៗ ដោយបម្រើតាមរបៀបដោយផ្ទាល់។
                                        {' '}ព្រែននឹងបញ្ជូនទៅកាន់គណនានៃហ្គេម <strong className="text-white">{game.name}</strong> របស់អ្នករយៈពេល <strong className="text-[#22c55e]">10</strong>នាទី ដល់ <strong className="text-[#22c55e]">3</strong>ម៉ោង។
                                    </>
                                ) : (
                                    <>
                                        Top up <strong className="text-white font-black">{game.name}</strong> credits instantly and securely!
                                        {' '}Enter your <strong className="text-[#22c55e]">Player ID</strong>, pick a package, and pay — credits land in your account in under <strong className="text-[#22c55e]">5 seconds</strong>.
                                        {' '}We are an <strong className="text-white">official distributor</strong>, so every top-up is guaranteed.
                                    </>
                                )}
                            </p>

                            {/* Divider */}
                            <div className="w-full h-px bg-gradient-to-r from-[#22c55e]/40 via-white/10 to-transparent mt-2" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <main className="max-w-7xl mx-auto px-6 lg:px-16 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* LEFT SIDE: Steps */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Step 1: Account Info */}
                        <div className="glass-card p-4 md:p-8 rounded-[32px] md:rounded-[42px] border-white/5 relative overflow-hidden group shadow-2xl bg-white/5 backdrop-blur-xl">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />

                            <div className="flex items-center gap-3 px-2 md:px-5 py-2 md:py-3 rounded-2xl md:rounded-[2rem] bg-purple-600/90 mb-8 border border-white/10 shadow-lg backdrop-blur-sm self-start inline-flex group/header">
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-purple-700/50 rounded-xl border border-white/20 overflow-hidden shadow-inner group-hover/header:rotate-12 transition-transform">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <h2 className={`font-display text-white font-black tracking-tight uppercase italic ${lang === 'km' ? 'khmer-text text-xs md:text-xl' : 'text-xs md:text-xl'}`}>
                                    1. {tr(t.topup.step1title, lang)}
                                </h2>
                            </div>

                            <div className={`grid ${game.inputConfig?.zoneId ? 'grid-cols-5' : 'grid-cols-1'} gap-2 md:gap-4`}>
                                <div className={`space-y-3 md:space-y-4 ${game.inputConfig?.zoneId ? 'col-span-3' : ''}`}>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-2">
                                        <Hash className="w-4 h-4 text-purple-500" />
                                        {tr(t.topup.playerIdLabel, lang)}
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                        <input
                                            type="text"
                                            value={userId}
                                            onChange={(e) => handlePlayerIdChange(e.target.value)}
                                            placeholder="e.g. 12345678"
                                            className="relative w-full bg-[#0a0a14]/60 border-2 border-slate-800/60 rounded-[24px] md:rounded-3xl px-4 md:px-6 py-3 md:py-5 text-white font-black text-[10px] md:text-[16px] focus:border-purple-500/50 focus:bg-[#0f0f1d] transition-all outline-none placeholder:text-slate-800 shadow-inner"
                                        />
                                    </div>
                                </div>
                                {game.inputConfig?.zoneId && (
                                    <div className="space-y-3 md:space-y-4 col-span-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-2">
                                            <Hash className="w-4 h-4 text-purple-500" />
                                            {tr(t.topup.zoneIdLabel, lang)}
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                            <input
                                                type="text"
                                                value={zoneId}
                                                onChange={(e) => { setZoneId(e.target.value); resetVerify(); }}
                                                placeholder="e.g. 1234"
                                                className="relative w-full bg-[#0a0a14]/60 border-2 border-slate-800/60 rounded-[24px] md:rounded-3xl px-4 md:px-6 py-3 md:py-5 text-white font-black text-[10px] md:text-[16px] focus:border-purple-500/50 focus:bg-[#0f0f1d] transition-all outline-none placeholder:text-slate-800 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 md:mt-8 flex flex-col sm:flex-row items-center gap-6">
                                <button
                                    onClick={handleVerify}
                                    disabled={!userId.trim() || isVerifying}
                                    className="w-fit px-5 py-2 md:py-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(124,58,237,0.3)] hover:shadow-purple-500/50 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
                                >
                                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    {isVerifying ? tr(t.topup.verifyingBtn, lang) : tr(t.topup.verifyBtn, lang)}
                                </button>
                                <p className="text-[8px] md:text-[12px] text-slate-500 font-bold uppercase tracking-widest text-center sm:text-left">{tr(t.topup.verifyHint, lang)}</p>
                            </div>

                            <VerifyBanner status={verifyStatus} verifiedName={verifiedName} verifyError={verifyError} lang={lang} />
                        </div>

                        {/* Step 2: Package Selection */}
                        <div className="glass-card p-4 md:p-8 rounded-[32px] md:rounded-[42px] border-white/5 relative overflow-hidden shadow-2xl bg-white/5 backdrop-blur-xl">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3 px-2 py-2 md:px-5 md:py-3 rounded-2xl md:rounded-[2rem] bg-indigo-600/90 border border-white/10 shadow-lg backdrop-blur-sm self-start inline-flex">
                                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-indigo-700/50 rounded-xl border border-white/20 overflow-hidden shadow-inner">
                                        <Image src="/package-logo.png" alt="" width={28} height={28} className="object-contain" />
                                    </div>
                                    <h2 className={`font-display text-white font-black tracking-tight uppercase italic ${lang === 'km' ? 'khmer-text md:text-xl text-xs' : 'md:text-xl text-xs'}`}>
                                        2. {lang === 'km' ? 'ជ្រើសរើសកញ្ចប់ ពេជ្រ' : tr(t.topup.step2title, lang)}
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {game.packages.map((pkg) => {
                                    const soldOut = isPackageSoldOut(pkg.amount);
                                    const formattedPkgName = formatPackageName(pkg.name);
                                    return (
                                        <button
                                            key={pkg.id}
                                            onClick={() => !soldOut && setSelectedPackage(pkg.id)}
                                            disabled={soldOut}
                                            className={`group relative flex items-center md:flex-col md:justify-center gap-2 p-2 md:p-4 rounded-3xl border-2 transition-all duration-500 overflow-visible md:min-h-[100px]
                                                ${soldOut
                                                    ? "border-white/5 bg-[#0d0b1d]/60 opacity-60 cursor-not-allowed"
                                                    : selectedPackage === pkg.id
                                                        ? "border-purple-500 bg-purple-500/15 shadow-[0_20px_40px_rgba(168,85,247,0.25)] scale-[1.02]"
                                                        : "border-white/10 bg-[#0d0b1d] hover:border-white/20 hover:bg-[#15122b] md:hover:-translate-y-2"
                                                }`}
                                        >
                                            {/* Weekly Pass Rebate Badge */}
                                            {(pkg.isWeeklyPass || formattedPkgName.toLowerCase().includes('pass')) && !soldOut && (
                                                <div className="absolute -top-4 -right-1 z-30 animate-float-gentle">
                                                    <div className="relative">
                                                        <div className="bg-gradient-to-r from-[#eb1c24] to-[#ff4d4d] text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 md:py-1 rounded-md shadow-[0_5px_15px_rgba(235,28,36,0.4)] -skew-x-6 border border-white/30 whitespace-nowrap italic tracking-tighter">
                                                            {lang === 'km' ? 'ចំណេញ: 455%' : 'REBATE: 455%'}
                                                        </div>
                                                        {/* Speech Bubble Tail */}
                                                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#eb1c24] rotate-45 -z-10" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sold Out overlay */}
                                            {soldOut && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/40 backdrop-blur-[2px]">
                                                    <span className="px-2 py-1 rounded-lg bg-red-600/90 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-red-400/30 shadow-lg">
                                                        {lang === 'km' ? 'អស់ស្តុក' : 'SOLD OUT'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="relative w-10 h-10 md:w-20 md:h-20 shrink-0 overflow-hidden rounded-2xl bg-white/5 p-2 transition-transform duration-500 group-hover:scale-110">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-50 group-hover:opacity-100" />
                                                <Image
                                                    src={getAssetUrl(game.iconUrl) || "/package-logo.png"}
                                                    alt={formattedPkgName}
                                                    fill
                                                    className="relative z-10 object-contain p-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                                    unoptimized={true}
                                                />
                                            </div>

                                            <div className="flex flex-col items-center justify-center flex-1 min-w-0 text-center px-1">
                                                <div className=" font-black text-white italic tracking-tighter leading-none mb-0.5">
                                                    <span className="text-[10px] md:text-xs mr-0.5 font-sans opacity-60">$</span>
                                                    <span className="text-[14px] md:text-xl">{Number(pkg.price).toFixed(2)}</span>
                                                </div>
                                                <div className={`text-[8px] md:text-xs font-black text-slate-400 leading-none italic tracking-tighter mt-1 w-full flex items-center justify-center gap-0.5 ${lang === 'km' ? 'khmer-text' : ''}`}>
                                                    <span className="max-w-full text-[7px] md:text-xs">{formattedPkgName}</span>
                                                    <span className="shrink-0 text-[7px] md:text-xs">{formattedPkgName.toLowerCase().includes('pass') ? '🎟️' : '💎'}</span>
                                                </div>
                                            </div>

                                            {selectedPackage === pkg.id && !soldOut && (
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-purple-500 blur-[2px] rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 3: Payment Method */}
                        <div className="glass-card p-4 md:p-8 rounded-[32px] md:rounded-[42px] border-white/5 relative overflow-hidden shadow-2xl bg-white/5 backdrop-blur-xl">
                            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

                            <div className="flex items-center gap-3 px-2 py-2 md:px-5 md:py-3 rounded-2xl md:rounded-[2rem] bg-emerald-600/90 mb-10 border border-white/10 shadow-lg backdrop-blur-sm self-start inline-flex group/header">
                                <div className="h-10 w-10 flex items-center justify-center bg-emerald-700/50 rounded-xl border border-white/20 overflow-hidden shadow-inner group-hover/header:scale-110 transition-transform">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <h2 className={`font-display text-white font-black tracking-tight uppercase italic ${lang === 'km' ? 'khmer-text md:text-xl text-xs' : 'md:text-xl text-xs'}`}>
                                    3. {tr(t.topup.step3title, lang)}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                {PAYMENT_METHODS.map((pm) => {
                                    const isSelected = selectedPayment === pm.id;
                                    return (
                                        <button
                                            key={pm.id}
                                            onClick={() => setSelectedPayment(pm.id)}
                                            className={`group relative flex items-center md:p-4 p-2 rounded-2xl border-2 transition-all duration-500 outline-none overflow-hidden text-left
                                                ${isSelected
                                                    ? "border-[#22c55e] bg-white/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                                                    : "border-white/5 bg-slate-900/40 hover:border-white/20"
                                                }`}
                                        >
                                            <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-xl overflow-hidden bg-white/5 p-2 shrink-0">
                                                <Image
                                                    src={pm.icon}
                                                    alt={pm.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>

                                            <div className="ml-4 flex-1">
                                                <div className="font-display font-black text-lg md:text-xl text-white tracking-tight leading-none">
                                                    {pm.name}
                                                </div>
                                                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                    {pm.desc}
                                                </p>
                                            </div>

                                            <div className="px-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#22c55e]' : 'border-slate-700'}`}>
                                                    {isSelected && <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Summary Sticky Column */}
                    <div className="lg:sticky lg:top-28 self-start space-y-8 h-fit">

                        {/* Summary Card */}
                        <div id="order-summary" className="summary-box p-8 md:p-10 rounded-[3.5rem] md:rounded-[4.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/10 relative overflow-hidden backdrop-blur-3xl bg-[#0f0d1a]/80">
                            <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />

                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                                <div className="relative group/icon flex-shrink-0">
                                    <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 group-hover/icon:opacity-40 transition-opacity" />
                                    <div className="relative p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h2 className="font-display text-lg md:text-xl font-black text-white tracking-widest uppercase italic">{tr(t.topup.orderSummary, lang)}</h2>
                            </div>

                            {status === "IDLE" || status === "FAILED" ? (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        {[
                                            { label: tr(t.topup.game, lang), value: game.name },
                                            { label: tr(t.topup.playerId, lang), value: userId || "—" },
                                            ...(game.inputConfig?.zoneId ? [{ label: tr(t.topup.zoneIdLabel, lang), value: zoneId || "—" }] : []),
                                            ...(verifiedName ? [{ label: "Receiver", value: verifiedName }] : []),
                                            ...(selectedPkg ? [{ label: tr(t.topup.package, lang), value: formatPackageName(selectedPkg.name) }] : []),
                                            { label: tr(t.topup.payment, lang), value: PAYMENT_METHODS.find(p => p.id === selectedPayment)?.name || "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-end gap-4 group">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors shrink-0">{label}</span>
                                                <div className="h-px flex-1 border-b border-dashed border-white/10 mb-1 opacity-30" />
                                                <span className="font-black text-white text-[11px] uppercase tracking-tight text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-white/10">
                                        {/* Reference Image Layout: Terms & Condition */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-black text-white tracking-widest uppercase italic">
                                                {tr(t.topup.termsTitle, lang)}
                                            </h3>
                                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                <div className="relative w-8 h-8 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={agreedToTerms}
                                                        onChange={() => setAgreedToTerms(!agreedToTerms)}
                                                    />
                                                    <div className={`w-full h-full rounded-lg border-2 flex items-center justify-center transition-all duration-300
                                                        ${agreedToTerms
                                                            ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                                            : 'border-slate-700 bg-white/5 group-hover:border-slate-500'
                                                        }`}>
                                                        {agreedToTerms && <Check className="w-5 h-5 text-white" strokeWidth={4} />}
                                                    </div>
                                                </div>
                                                <span className={`text-md font-black italic tracking-tight ${lang === 'km' ? 'khmer-text' : ''}`}>
                                                    {tr(t.topup.agreeToTerms, lang)} <span className="text-[#22c55e] underline underline-offset-4 decoration-2">{lang === 'km' ? 'លក្ខខណ្ឌ' : 'Terms'}</span>
                                                </span>
                                            </label>
                                        </div>

                                        <div className="flex flex-col gap-1 mt-4">
                                            <div className="text-3xl font-black text-white italic tracking-tight uppercase">
                                                Total: {selectedPkg ? Number(selectedPkg.price).toFixed(2) : "0.00"}$
                                            </div>
                                        </div>

                                        {txError && (
                                            <div className="p-4 rounded-3xl bg-red-500/10 border-2 border-red-500/20 text-[10px] text-red-400 font-bold uppercase tracking-widest text-center animate-shake">
                                                ⚠️ {txError}
                                            </div>
                                        )}

                                        <div className="relative pt-4">
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!isFormValid || isLoading}
                                                className="w-full relative group h-16 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                            >
                                                {/* Skewed background layer */}
                                                <div className={`absolute inset-0 -skew-x-12 rounded-lg transition-all duration-500
                                                    ${isFormValid && !isLoading
                                                        ? 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] shadow-[0_10px_30px_rgba(34,197,94,0.3)]'
                                                        : 'bg-slate-800'
                                                    }`}
                                                />

                                                <div className="relative h-full flex items-center justify-center gap-3 text-white">
                                                    {isLoading ? (
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <span className="font-display font-black text-2xl italic tracking-widest text-[#050505]">
                                                            {lang === 'km' ? tr(t.topup.buyNow, lang) : 'BUY NOW'}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        </div>

                                        {!isFormFilled ? (
                                            <p className="text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.15em] animate-pulse">
                                                {tr(t.topup.completeSteps, lang)}
                                            </p>
                                        ) : !isVerified ? (
                                            <p className="text-center text-[10px] text-amber-500 font-black uppercase tracking-[0.15em] animate-pulse">
                                                {lang === 'km' ? 'សូមធ្វើការផ្ទៀងផ្ទាត់គណនីរបស់អ្នកសិន' : 'PLEASE VERIFY YOUR ACCOUNT TO PROCEED'}
                                            </p>
                                        ) : !agreedToTerms ? (
                                            <p className="text-center text-[10px] text-blue-500 font-black uppercase tracking-[0.15em] animate-pulse">
                                                {lang === 'km' ? 'សូមយល់ព្រមតាមលក្ខខណ្ឌសិន' : 'PLEASE AGREE TO TERMS TO PROCEED'}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-[32px] text-center border-2 ${status === "COMPLETED"
                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                        : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                        }`}>
                                        {status === "PENDING" && (
                                            <div className="flex flex-col items-center gap-3 py-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                                <span className="font-black text-[10px] uppercase tracking-widest">{tr(t.topup.creating, lang)}</span>
                                            </div>
                                        )}
                                        {status === "PROCESSING" && (
                                            <div className="flex flex-col items-center gap-3 py-2">
                                                <div className="relative">
                                                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                                    <div className="absolute inset-0 bg-purple-400/20 blur-xl animate-pulse" />
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-widest">{tr(t.topup.awaiting, lang)}</span>
                                            </div>
                                        )}
                                        {status === "COMPLETED" && (
                                            <div className="flex flex-col items-center gap-3 py-2">
                                                <CheckCircle className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                                <span className="font-black text-[10px] uppercase tracking-widest">{tr(t.topup.success, lang)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {status === "COMPLETED" && (
                                        <button
                                            onClick={handleNewTransaction}
                                            className="w-full h-14 rounded-3xl bg-slate-900 border border-white/5 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {tr(t.topup.newTx, lang)}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Trust Badge Integration in Summary */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5" />
                                        {tr(t.topup.sslEncrypted, lang)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        {tr(t.topup.sec5, lang)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile View Summary Button (Quick Scroll) */}
                        {isFormValid && (
                            <button
                                onClick={() => document.getElementById('order-summary')?.scrollIntoView({ behavior: 'smooth' })}
                                className="lg:hidden w-full h-14 rounded-3xl bg-purple-600/10 border border-purple-500/30 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] hover:bg-purple-600/20 transition-all"
                            >
                                {tr(t.topup.viewSummary, lang)}
                            </button>
                        )}

                        {/* Additional Trust Card */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { Icon: Zap, color: "text-amber-400" },
                                { Icon: Shield, color: "text-cyan-400" },
                                { Icon: HeadphonesIcon, color: "text-purple-400" },
                            ].map(({ Icon, color }, idx) => (
                                <div key={idx} className="glass-card p-4 rounded-2xl bg-white/5 border-white/5 flex items-center justify-center shadow-lg">
                                    <Icon className={`${color} w-5 h-5 drop-shadow-md`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <HowToUseSection lang={lang} />

            {/* Global Modals */}
            {paymentData && status === "PROCESSING" && (
                <KhqrModal
                    qrCode={paymentData.qrCode}
                    amount={selectedPkg ? Number(selectedPkg.price).toFixed(2) : "0.00"}
                    playerName={verifiedName || undefined}
                    onCancel={() => { setPaymentData(null); setStatus("IDLE"); }}
                />
            )}
        </div>
    );
}
