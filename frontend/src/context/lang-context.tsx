"use client";

import React, { createContext, useContext, useState } from "react";
import type { Lang } from "@/lib/i18n";

interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    toggle: () => void;
}

const LangContext = createContext<LangContextType>({
    lang: "en",
    setLang: () => { },
    toggle: () => { },
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    // Force set to "en" and remove multi-language logic
    const [lang] = useState<Lang>("en");

    const setLang = (_l: Lang) => {
        // Do nothing, English only
    };

    const toggle = () => {
        // Do nothing, English only
    };

    return (
        <LangContext.Provider value={{ lang, setLang, toggle }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}
