import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    delay?: string;
}

export function GlassCard({ children, className = "", delay = "" }: GlassCardProps) {
    return (
        <div className={`glass-card p-7 animate-fade-in-up ${delay} ${className}`}>
            {children}
        </div>
    );
}
