"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

export function SupportHub() {
    const [isOpen, setIsOpen] = useState(false);

    const CONTACT_LINKS = [
        {
            name: "Telegram Support",
            handle: "@ratha_dev",
            url: "https://t.me/ratha_dev", // Using user's contact point or placeholder
            icon: Send,
            color: "bg-[#0088cc]",
        }
    ];

    return (
        <div className="fixed bottom-8 left-8 z-40 flex flex-col items-start gap-4">
            {/* Popover Menu */}
            {isOpen && (
                <div className="mb-2 w-64 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="overflow-hidden rounded-[2rem] bg-[#0f0d1a] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 p-5 border-b border-white/5">
                            <h4 className="text-white font-black text-sm uppercase tracking-widest italic">
                                SUPPORT HUB
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                Instant Response 24/7
                            </p>
                        </div>
                        
                        <div className="p-3 space-y-2">
                            {CONTACT_LINKS.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                                >
                                    <div className={`h-10 w-10 ${link.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                        <link.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase tracking-tight">{link.name}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{link.handle}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                        
                        <div className="bg-white/[0.02] p-4 text-center border-t border-white/5">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                Payment issue? Contact us now!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 shadow-2xl
                    ${isOpen 
                        ? "bg-[#0f0d1a] border-white/10 rotate-90" 
                        : "bg-gradient-to-br from-emerald-500 to-teal-600 border-white/20 hover:scale-110 active:scale-95"
                    }`}
            >
                {/* Glow Effect */}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-2xl bg-emerald-500/40 blur-xl animate-pulse -z-10" />
                )}
                
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-7 h-7 text-white fill-white/10 group-hover:scale-110 transition-transform" />
                )}
                
                {/* Status Indicator */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#07060e]"></span>
                    </span>
                )}
            </button>
        </div>
    );
}
