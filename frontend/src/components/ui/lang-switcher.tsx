"use client";

import { useLang } from "@/context/lang-context";

export function LangSwitcher({ className = "" }: { className?: string }) {
    const { lang, setLang } = useLang();

    return (
        <div className={`flex items-center rounded-lg overflow-hidden border border-purple-700/30 bg-purple-900/20 ${className}`}>
            <button
                onClick={() => setLang("km")}
                className={`px-3 py-1.5 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${lang === "km"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-purple-900/40"
                    }`}
                title="ភាសាខ្មែរ"
            >
                🇰🇭 <span className="khmer-text">ខ្មែរ</span>
            </button>
            <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${lang === "en"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-purple-900/40"
                    }`}
                title="English"
            >
                🇬🇧 EN
            </button>
        </div>
    );
}
