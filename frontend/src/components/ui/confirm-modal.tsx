'use client';

import { ShieldAlert, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isAlert?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    description,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    isAlert = false
}: ConfirmModalProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsMounted(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted && !isOpen) return null;

    const variantStyles = {
        danger: 'from-rose-500 to-rose-600 shadow-rose-900/40 border-rose-500/50',
        warning: 'from-amber-500 to-amber-600 shadow-amber-900/40 border-amber-500/50',
        info: 'from-indigo-500 to-indigo-600 shadow-indigo-900/40 border-indigo-500/50',
        success: 'from-emerald-500 to-emerald-600 shadow-emerald-900/40 border-emerald-500/50'
    };

    const iconStyles = {
        danger: 'text-rose-500 bg-rose-500/10',
        warning: 'text-amber-500 bg-amber-500/10',
        info: 'text-indigo-500 bg-indigo-500/10',
        success: 'text-emerald-500 bg-emerald-500/10'
    };

    const btnStyles = {
        danger: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50',
        warning: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50',
        info: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50',
        success: 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/50'
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onCancel}
            />

            {/* Modal Container */}
            <div
                className={`relative w-full max-w-md overflow-hidden bg-[#0f111a] border border-white/5 rounded-[28px] shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Header Gradient Stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${variantStyles[variant]}`} />

                <div className="p-8">
                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Icon */}
                        <div className={`p-4 rounded-2xl ${iconStyles[variant]} animate-bounce-slow`}>
                            <ShieldAlert className="w-8 h-8" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white italic tracking-wider uppercase">
                                {title}
                            </h3>
                        <div className="text-slate-400 text-sm leading-relaxed px-2">
                            {description}
                        </div>
                    </div>

                        {/* Actions */}
                        <div className={`grid ${isAlert ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full pt-2`}>
                            {!isAlert && (
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className={`px-6 py-3.5 rounded-2xl ${btnStyles[variant]} text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg focus:ring-4 focus:outline-none`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subtle bottom decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </div>
    );
}
