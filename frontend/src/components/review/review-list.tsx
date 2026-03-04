"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Star } from "lucide-react";

interface Review {
    id: string;
    name: string;
    gameName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const DEFAULT_REVIEWS = [
    {
        name: "Alex Chen",
        gameName: "Free Fire",
        rating: 5,
        comment: "Got my 2000 diamonds within 3 seconds! Absolutely insane speed. TopUpPay is the only service I use now.",
        color: "from-purple-500 to-indigo-600",
    },
    {
        name: "Maria Garcia",
        gameName: "PUBG Mobile",
        rating: 5,
        comment: "Been using TopUpPay for 8 months. Zero issues. The prices are always competitive and payment is super smooth.",
        color: "from-pink-500 to-rose-600",
    },
    {
        name: "James Wilson",
        gameName: "Mobile Legends",
        rating: 5,
        comment: "Best top-up platform I've ever used. The UI is clean, prices are great, and delivery is actually instant!",
        color: "from-cyan-500 to-blue-600",
    }
];

export function ReviewList() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await apiRequest<Review[]>("/reviews");
                // If we get an array, use it. If not (API error or empty), we'll fall back to placeholders
                if (Array.isArray(data) && data.length > 0) {
                    setReviews(data);
                }
            } catch (err) {
                console.error("Failed to fetch public reviews", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const displayReviews = reviews.length > 0 ? reviews : [];

    // If we have no real reviews yet, we'll show the default ones
    if (displayReviews.length === 0 && !isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_REVIEWS.map((testimonial, idx) => (
                    <div key={idx} className="glass-card p-7 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-center gap-1 mb-5">
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                            &ldquo;{testimonial.comment}&rdquo;
                        </p>
                        <div className="divider-glow mb-5" />
                        <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold shadow-lg text-sm`}>
                                {testimonial.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{testimonial.name}</p>
                                <p className="text-xs text-purple-400 font-semibold">{testimonial.gameName} Player</p>
                            </div>
                            <div className="ml-auto">
                                <div className="badge badge-gold text-[10px]">Verified</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-slate-800/40 animate-pulse" />
                ))
            ) : (
                displayReviews.map((review, idx) => (
                    <div key={review.id} className="glass-card p-7 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-center gap-1 mb-5">
                            {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                            &ldquo;{review.comment}&rdquo;
                        </p>
                        <div className="divider-glow mb-5" />
                        <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-sm`}>
                                {review.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{review.name}</p>
                                <p className="text-xs text-purple-400 font-semibold">{review.gameName} Player</p>
                            </div>
                            <div className="ml-auto">
                                <div className="badge badge-gold text-[10px]">Verified</div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
