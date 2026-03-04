"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Lang } from "@/lib/i18n";

interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    toggle: () => void;
}

const LangContext = createContext<LangContextType>({
    lang: "km",
    setLang: () => { },
    toggle: () => { },
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("km");

    // Restore from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("lang") as Lang | null;
        if (saved === "en" || saved === "km") {
            setLangState(saved);
        }
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem("lang", l);
    };

    const toggle = () => setLang(lang === "en" ? "km" : "en");

    return (
        <LangContext.Provider value={{ lang, setLang, toggle }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}
