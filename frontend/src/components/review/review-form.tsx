"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";
import { Star, Send, X, CheckCircle2, ChevronDown } from "lucide-react";

interface Game {
    id: string;
    name: string;
}

export function ReviewForm({ onReviewSubmitted }: { onReviewSubmitted?: () => void }) {
    const [name, setName] = useState("");
    const [gameName, setGameName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [games, setGames] = useState<Game[]>([]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const container = document.getElementById("game-dropdown-container");
            if (container && !container.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    React.useEffect(() => {
        if (isExpanded && games.length === 0) {
            const fetchGames = async () => {
                try {
                    const data = await apiRequest<Game[]>("/games");
                    setGames(data);
                    if (data.length > 0 && !gameName) {
                        setGameName(data[0].name);
                    }
                } catch (err) {
                    console.error("Failed to fetch games for review", err);
                }
            };
            fetchGames();
        }
    }, [isExpanded, games.length, gameName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameName) {
            alert("Please select a game first");
            return;
        }
        setIsLoading(true);
        try {
            await apiRequest("/reviews", {
                method: "POST",
                body: JSON.stringify({ name, gameName, rating, comment }),
            });
            setIsSuccess(true);
            setName("");
            setGameName("");
            setComment("");
            setRating(5);
            if (onReviewSubmitted) onReviewSubmitted();
            // Reset success message after 5 seconds
            setTimeout(() => {
                setIsSuccess(false);
                setIsExpanded(false);
            }, 5000);
        } catch (error: any) {
            alert(error.message || "Failed to submit review");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 flex items-center justify-between group transition-all"
            >
                <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold tracking-wide">Share your experience! Click to leave a review</span>
                </div>
                <Send className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
            </button>
        );
    }

    return (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative animate-slide-in-down overflow-hidden">
            {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Review Submitted!</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                        Thank you for your feedback! Your review will be visible once approved by an administrator.
                    </p>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <h3 className="text-xl font-bold text-white mb-6 tracking-wide flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                        Write a Review
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Game Name</label>
                                <div className="relative" id="game-dropdown-container">
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white flex items-center justify-between hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                                    >
                                        <span className={gameName ? "text-white" : "text-slate-500"}>
                                            {gameName || "Select Game..."}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-indigo-400" : ""}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl py-2 animate-scale-in max-h-60 overflow-y-auto custom-scrollbar">
                                            {games.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-slate-500 italic">Loading games...</div>
                                            ) : (
                                                games.map((g) => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setGameName(g.name);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between hover:bg-indigo-500/10 ${gameName === g.name ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-300 hover:text-white"}`}
                                                    >
                                                        {g.name}
                                                        {gameName === g.name && <CheckCircle2 className="w-4 h-4" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 tracking-widest">Rate your experience</label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className="p-1 hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Feedback</label>
                            <textarea
                                required
                                rows={3}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Describe your top-up experience..."
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                            ></textarea>
                        </div>

                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold tracking-widest uppercase text-sm shadow-xl shadow-indigo-900/40 hover:shadow-indigo-900/60 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? "Submitting..." : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Post Review
                                </>
                            )}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
