import { ReactNode } from "react";

interface SectionLabelProps {
    children: ReactNode;
    icon?: ReactNode;
    className?: string;
    animate?: boolean;
}

export function SectionLabel({ children, icon, className = "", animate = false }: SectionLabelProps) {
    return (
        <div className={`section-label mb-4 mx-auto w-fit ${animate ? "animate-bounce-slow" : ""} ${className}`}>
            {icon && <span className="mr-2 opacity-80">{icon}</span>}
            {children}
        </div>
    );
}
