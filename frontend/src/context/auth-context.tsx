"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    isChecking: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Initialize token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("admin_token");
        if (storedToken) {
            setToken(storedToken);
        }
        setIsChecking(false);
    }, []);

    const login = useCallback((newToken: string) => {
        localStorage.setItem("admin_token", newToken);
        setToken(newToken);
        router.replace("/admin");
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem("admin_token");
        setToken(null);
        router.replace("/admin/login");
    }, [router]);

    // Global Route Protection Logic
    useEffect(() => {
        if (!isChecking) {
            const isAdminPath = pathname?.startsWith("/admin");
            const isLoginPage = pathname === "/admin/login";

            if (isAdminPath && !isLoginPage && !token) {
                router.replace("/admin/login");
            } else if (isLoginPage && token) {
                router.replace("/admin");
            }
        }
    }, [pathname, token, isChecking, router]);

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
                isChecking,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
