"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, RefreshCw, CheckCircle, XCircle, LayoutGrid } from 'lucide-react';

export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

interface StatusOption {
    value: TransactionStatus | 'ALL';
    label: string;
    icon: React.ElementType;
    color: string;
}

const statusOptions: StatusOption[] = [
    { value: 'ALL', label: 'ALL STATUSES', icon: LayoutGrid, color: 'text-slate-400' },
    { value: 'PENDING', label: 'PENDING', icon: Clock, color: 'text-amber-400' },
    { value: 'PROCESSING', label: 'PROCESSING', icon: RefreshCw, color: 'text-indigo-400' },
    { value: 'COMPLETED', label: 'COMPLETED', icon: CheckCircle, color: 'text-emerald-400' },
    { value: 'FAILED', label: 'FAILED', icon: XCircle, color: 'text-red-400' },
    { value: 'EXPIRED', label: 'EXPIRED', icon: Clock, color: 'text-slate-500' },
];

export function StatusDropdown({ 
    value, 
    onChange 
}: { 
    value: TransactionStatus | 'ALL'; 
    onChange: (status: TransactionStatus | 'ALL') => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = statusOptions.find(opt => opt.value === value) || statusOptions[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full h-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full flex items-center justify-between px-8 py-4 bg-[#0a0a14]/40 border-2 transition-all duration-500 rounded-full group
                    ${isOpen 
                        ? 'border-indigo-500/50 bg-[#0f0f1d] shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.01]' 
                        : 'border-white/5 hover:border-indigo-500/30 hover:bg-[#0f0f1d]/50'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/10 transition-colors ${isOpen ? 'bg-indigo-500/10' : ''}`}>
                        <selectedOption.icon className={`w-4 h-4 ${selectedOption.color} ${value === 'PROCESSING' ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-white text-[11px] font-black uppercase tracking-[0.25em] italic">
                        {selectedOption.label}
                    </span>
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/5 transition-all duration-500 ${isOpen ? 'rotate-180 bg-indigo-500/20' : 'group-hover:bg-white/10'}`}>
                    <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute top-full left-0 right-0 mt-4 z-50 p-2 bg-[#0a0a14]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-300 origin-top
                ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'}`}>
                <div className="grid grid-cols-1 gap-1.5">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group/item relative overflow-hidden
                                ${value === opt.value 
                                    ? 'bg-indigo-500/10 text-white' 
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300
                                ${value === opt.value ? 'bg-indigo-500/20' : 'bg-white/5 group-hover/item:bg-white/10'}`}>
                                <opt.icon className={`w-4 h-4 ${opt.color} group-hover/item:scale-110 transition-transform ${opt.value === 'PROCESSING' && value === opt.value ? 'animate-spin' : ''}`} />
                            </div>
                            
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{opt.label}</span>
                                {opt.value !== 'ALL' && (
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Filter by {opt.label.toLowerCase()} status</span>
                                )}
                            </div>

                            {value === opt.value && (
                                <div className="ml-auto flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
                                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    </div>
                                </div>
                            )}

                            {/* Hover Highlight */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
