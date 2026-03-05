"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { Star, CheckCircle, XCircle, Trash2, Clock, MessageSquare, Gamepad2 } from "lucide-react";

interface Review {
    id: string;
    name: string;
    gameName: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    createdAt: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        try {
            const data = await apiRequest<Review[]>("/admin/reviews");
            setReviews(data || []);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleApproveToggle = async (id: string, currentStatus: boolean) => {
        try {
            await apiRequest(`/admin/reviews/${id}/approve`, {
                method: 'PUT',
                body: JSON.stringify({ isApproved: !currentStatus }),
            });
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: !currentStatus } : r));
        } catch (err) {
            alert("Failed to update review status");
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            await apiRequest(`/admin/reviews/${id}`, { method: 'DELETE' });
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert("Failed to delete review");
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Reviews</h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">
                        Moderate and manage user reviews
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                            <MessageSquare className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Total Reviews</p>
                            <p className="text-3xl font-black text-white italic tabular-nums">{reviews.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Approved</p>
                            <p className="text-3xl font-black text-white italic tabular-nums">{reviews.filter(r => r.isApproved).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                            <Clock className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pending</p>
                            <p className="text-3xl font-black text-white italic tabular-nums">{reviews.filter(r => !r.isApproved).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800/40" />
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 mx-auto mb-4 flex items-center justify-center">
                        <Star className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">No reviews yet</h3>
                    <p className="text-slate-400 mt-2">When customers leave feedback, it will appear here for moderation.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="group bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Left Side: User Info & Ratings */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {review.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{review.name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                <Gamepad2 className="w-3 h-3" />
                                                {review.gameName}
                                                <span className="mx-1">•</span>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed italic">
                                        &quot;{review.comment}&quot;
                                    </p>
                                </div>

                                {/* Right Side: Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleApproveToggle(review.id, review.isApproved)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${review.isApproved
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                                            }`}
                                    >
                                        {review.isApproved ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Approved
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-4 h-4" />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
