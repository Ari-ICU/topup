"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiRequest, getAssetUrl } from "@/lib/api";
import { Zap, ChevronRight } from "lucide-react";
import { useLang } from "@/context/lang-context";
import { t, tr } from "@/lib/i18n";

interface Game {
    id: string;
    slug: string;
    name: string;
    iconUrl: string;
    isActive: boolean;
    packages?: Array<{ id: string; price: number }>;
    _count?: { packages: number };
}


export function GameGrid() {
    const { lang } = useLang();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await apiRequest<Game[]>("/games");
                if (data && data.length > 0) {
                    setGames(data);
                } else {
                    console.warn("[GameGrid] No games returned from API.");
                    setGames([]);
                }
            } catch (error) {
                console.error("Failed to fetch games:", error);
                setGames([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="shimmer h-64 rounded-2xl"
                        style={{ animationDelay: `${i * 0.07}s` }}
                    />
                ))}
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-700/30 to-indigo-700/20 border border-purple-700/30 flex items-center justify-center mb-4">
                    <Zap className="w-9 h-9 text-purple-400" />
                </div>
                <h3 className={`font-display text-xl font-bold text-white mb-2 ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.gamesSection.noGamesFound, lang)}</h3>
                <p className={`text-slate-500 text-sm ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.gamesSection.checkBackSoon, lang)}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {games.map((game, idx) => {
                const hasPackages = (game.packages && game.packages.length > 0) || (game._count && game._count.packages > 0);
                const startingPrice = game.packages?.[0]?.price || 0;

                const cardContent = (
                    <div className="relative group flex flex-col items-center text-center">
                        {/* THE SQUIRCLE ICON */}
                        <div className={`relative w-full aspect-square rounded-[42px] overflow-hidden border-2 transition-all duration-700 shadow-2xl p-4
                            ${hasPackages
                                ? "bg-slate-900/60 border-purple-500/20 group-hover:border-purple-400 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:-translate-y-2 group-hover:rotate-1"
                                : "bg-slate-950/40 border-slate-800/40 opacity-60 grayscale"
                            }`}>

                            <div className="relative w-full h-full">
                                <Image
                                    src={getAssetUrl(game.iconUrl) || "/hero-image.png"}
                                    alt={game.name}
                                    fill
                                    className={`object-contain transition-all duration-700 ${hasPackages ? 'group-hover:scale-110 group-hover:rotate-[-2deg]' : ''}`}
                                    unoptimized={true}
                                />
                                {/* Bottom Inner Glow */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Floating Badges */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                {hasPackages && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-lg">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">LIVE</span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {hasPackages && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                        <Zap className="w-3 h-3 text-white fill-current" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GAME INFO */}
                        <div className="mt-5 space-y-2 px-2">
                            <h3 className={`font-display text-[10px] md:text-lg font-black italic tracking-tighter text-white transition-all
                                ${hasPackages ? 'group-hover:text-purple-300' : 'text-slate-500'}`}>
                                {game.name.toUpperCase()}
                            </h3>

                            {/* {hasPackages ? (
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 ${lang === 'km' ? 'khmer-text text-[11px]' : ''}`}>
                                        {tr(t.gamesSection.startingFrom, lang)}
                                    </span>
                                    <div className="text-xl font-black text-purple-400 italic tracking-tighter drop-shadow-md">
                                        ${startingPrice > 0 ? startingPrice.toFixed(2) : "0.99"}
                                    </div>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                                    <div className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className={`text-[9px] font-black text-slate-600 uppercase tracking-widest ${lang === 'km' ? 'khmer-text' : ''}`}>{tr(t.gamesSection.comingSoon, lang)}</span>
                                </div>
                            )} */}
                        </div>

                        {/* Interactive underline */}
                        {hasPackages && (
                            <div className="mt-4 w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-purple-500 transition-all duration-500" />
                        )}
                    </div>
                );

                return hasPackages ? (
                    <Link
                        key={game.id}
                        href={`/topup/${game.slug}`}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                    >
                        {cardContent}
                    </Link>
                ) : (
                    <div
                        key={game.id}
                        className="animate-fade-in-up cursor-not-allowed"
                        style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                    >
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}
