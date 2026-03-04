"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { apiRequest, ApiError } from "@/lib/api";
import { Plus, Edit2, Trash2, Gift, Copy, ChevronDown, CheckCircle2, Gamepad2, X, AlertTriangle, CheckCircle, XCircle, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface PackageItem {
    id: string;
    gameId?: string;
    name: string;
    amount: number;
    points: number;
    price: number | string;
    description?: string;
    isWeeklyPass: boolean;
    sortOrder: number;
    game: string | { name?: string; slug?: string; iconUrl?: string } | unknown;
}

function AdminPackagesContent() {
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [games, setGames] = useState<{ id: string; name: string }[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);

    // Refs for click-outside detection
    const filterDropdownRef = React.useRef<HTMLDivElement>(null);
    const formDropdownRef = React.useRef<HTMLDivElement>(null);

    // Filter & Search states
    const [filterGameId, setFilterGameId] = useState<string>('all');
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    // MooGold Autocomplete states
    const [mooGoldProducts, setMooGoldProducts] = useState<any[]>([]);
    const [isFetchingMooGold, setIsFetchingMooGold] = useState(false);
    const [showMooGoldDropdown, setShowMooGoldDropdown] = useState(false);

    // Sync local search with URL
    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) setSearchQuery(q);
    }, [searchParams]);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check filter dropdown
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
            // Check form dropdown
            if (formDropdownRef.current && !formDropdownRef.current.contains(event.target as Node)) {
                setIsFormDropdownOpen(false);
            }
        };

        if (isFilterDropdownOpen || isFormDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isFilterDropdownOpen, isFormDropdownOpen]);

    // Form data for creating/editing a package
    const [formData, setFormData] = useState({
        name: '',
        gameId: '',
        amount: '',
        points: '0',
        price: '',
        providerCode: 'MOOGOLD',
        providerSku: '',
        description: '',
        isWeeklyPass: false,
        sortOrder: '0'
    });

    const fetchPackages = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest<PackageItem[]>('/admin/packages');
            setPackages(data ?? []);
        } catch (err) {
            console.error('Failed to fetch packages', err);
            setPackages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchGames = useCallback(async () => {
        try {
            const data = await apiRequest<{ id: string; name: string }[]>('/admin/games');
            setGames(data ?? []);
        } catch (err) {
            console.error('Failed to fetch games', err);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
        fetchGames();
    }, [fetchPackages, fetchGames]);

    const handleFetchMooGoldProducts = async () => {
        setIsFetchingMooGold(true);
        try {
            const data = await apiRequest<any[]>('/admin/moogold/products');
            setMooGoldProducts(data || []);
            setShowMooGoldDropdown(true);
            showToast('MooGold catalog fetched successfully!', 'success');
        } catch (err: any) {
            console.error('Failed to fetch MooGold products', err);
            showToast(err.message || 'Failed to sync with MooGold', 'error');
        } finally {
            setIsFetchingMooGold(false);
        }
    };

    const handleSubmitPackage = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure a game is selected before submitting
        if (!formData.gameId) {
            showToast('Deployment protocol blocked: Select a central Game Sector node before initializing asset.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const bodyData = {
                name: formData.name,
                gameId: formData.gameId,
                amount: parseInt(formData.amount, 10),
                points: parseInt(formData.points, 10) || 0,
                price: parseFloat(formData.price),
                providerCode: formData.providerCode,
                providerSku: formData.providerSku || `${formData.gameId}_${formData.amount}`,
                description: formData.description,
                isWeeklyPass: formData.isWeeklyPass,
                sortOrder: parseInt(formData.sortOrder, 10) || 0
            };

            if (editingPackageId) {
                const updatedPkg = await apiRequest<PackageItem>(`/admin/packages/${editingPackageId}`, {
                    method: 'PUT',
                    body: JSON.stringify(bodyData),
                });
                setPackages(prev => prev.map(p => p.id === editingPackageId ? updatedPkg : p));
                showToast('Package updated successfully!', 'success');
            } else {
                const newPkg = await apiRequest<PackageItem>('/admin/packages', {
                    method: 'POST',
                    body: JSON.stringify(bodyData),
                });
                setPackages((prev) => [...prev, newPkg]);
                showToast('Package created successfully!', 'success');
            }

            setShowForm(false);
            setEditingPackageId(null);
            setIsDuplicating(false);
            setIsFormDropdownOpen(false);
            setFormData({ name: '', gameId: '', amount: '', points: '0', price: '', providerCode: 'MOOGOLD', providerSku: '', description: '', isWeeklyPass: false, sortOrder: '0' });
        } catch (err: any) {
            console.error('Failed to save package', err);
            showToast(err.message || 'Failed to save package', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (pkg: PackageItem & { providerSku?: string }) => {
        setFormData({
            name: pkg.name,
            gameId: pkg.gameId || '',
            amount: pkg.amount.toString(),
            points: pkg.points.toString(),
            price: pkg.price.toString(),
            providerCode: 'MOOGOLD',
            providerSku: pkg.providerSku || '',
            description: pkg.description || '',
            isWeeklyPass: pkg.isWeeklyPass || false,
            sortOrder: (pkg.sortOrder ?? 0).toString()
        });
        setEditingPackageId(pkg.id);
        setIsDuplicating(false);
        setIsFormDropdownOpen(false);
        setShowForm(true);
    };

    const handleDuplicateClick = (pkg: PackageItem & { providerSku?: string }) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFormData({
            name: `${pkg.name} (Copy)`,
            gameId: pkg.gameId || '',
            amount: pkg.amount.toString(),
            points: pkg.points.toString(),
            price: pkg.price.toString(),
            providerCode: 'MOOGOLD',
            providerSku: pkg.providerSku || '',
            description: pkg.description || '',
            isWeeklyPass: pkg.isWeeklyPass || false,
            sortOrder: (pkg.sortOrder ?? 0).toString()
        });
        setEditingPackageId(null);
        setIsDuplicating(true);
        setShowForm(true);
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || searchQuery) return;

        const items = Array.from(filteredPackages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Map back to the full packages list (replacing only the filtered ones in their new order)
        // This is a bit tricky if we are reordering while filtered, so we usually only allow reorder 
        // when filtering by game or when not filtered.
        const newPackages = [...packages];
        items.forEach((item, index) => {
            const originalIndex = newPackages.findIndex(p => p.id === item.id);
            if (originalIndex !== -1) {
                newPackages[originalIndex] = { ...item, sortOrder: index };
            }
        });

        // Optimistic update
        setPackages(newPackages);

        try {
            await apiRequest('/admin/packages/reorder', {
                method: 'POST',
                body: JSON.stringify({ ids: items.map(i => i.id) })
            });
            showToast('Order updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update order', error);
            fetchPackages();
            showToast('Failed to update sort order', 'error');
        }
    };

    const handleDeletePackage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            await apiRequest(`/admin/packages/${id}`, { method: 'DELETE' });
            setPackages((prev) => prev.filter((p) => p.id !== id));
            showToast('Package deleted.', 'success');
        } catch (err: any) {
            console.error('Failed to delete package', err);
            // 404 → already gone, remove from list silently
            if (err?.status === 404) {
                setPackages((prev) => prev.filter((p) => p.id !== id));
                return;
            }
            // 409 → has linked transactions — cannot delete
            if (err?.status === 409) {
                showToast(err.message, 'warning');
                return;
            }
            showToast(err.message || 'Failed to delete package', 'error');
        }
    };

    // ── Filtered Packages ────────────────────────────────────────────────────
    const filteredPackages = packages.filter((pkg: PackageItem) => {
        const gameObj = pkg.game && typeof pkg.game === 'object' ? (pkg.game as any) : null;
        const gameId = pkg.gameId || gameObj?.id || '';

        const matchesGame = filterGameId === 'all' || gameId === filterGameId;
        const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof pkg.game === 'string' ? pkg.game : gameObj?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesGame && matchesSearch;
    }).sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-6 animate-fade-in">

            {/* ── Toast Notification ──────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] flex items-start gap-3 max-w-md px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm animate-fade-in transition-all ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200' :
                    toast.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500/40 text-yellow-200' :
                        'bg-red-900/80 border-red-500/40 text-red-200'
                    }`}>
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />}
                    {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" />}
                    {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />}
                    <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Asset Inventory</h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">
                        Configure and deploy currency acquisition nodes
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingPackageId(null);
                        setIsDuplicating(false);
                        setIsFormDropdownOpen(false);
                        setFormData({ name: '', gameId: '', amount: '', points: '0', price: '', providerCode: 'MOOGOLD', providerSku: '', description: '', isWeeklyPass: false, sortOrder: '0' });
                        setShowForm((s) => !s);
                    }}
                    className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Plus className="w-5 h-5 text-white" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Initialize Asset</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-md relative z-30">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Plus className="w-4 h-4 text-slate-500 rotate-45 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search global operations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-white text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-white/10 transition-all placeholder:text-slate-700"
                    />
                </div>

                <div className="grid grid-cols-2 lg:flex gap-4">
                    {/* Game Filter */}
                    {/* Game Filter Dropdown */}
                    <div className="relative min-w-[240px]" ref={filterDropdownRef}>
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`w-full flex items-center justify-between px-6 py-4 bg-white/5 border rounded-2xl transition-all duration-300 group ${isFilterDropdownOpen ? 'border-indigo-500/50 ring-2 ring-indigo-500/20' : 'border-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Gamepad2 className={`w-4 h-4 transition-colors ${isFilterDropdownOpen ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                                <span className="text-[11px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                                    {filterGameId === 'all' ? 'ALL SECTORS' : games.find(g => g.id === filterGameId)?.name || 'SELECT SECTOR'}
                                </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                        </button>

                        {isFilterDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#0c0c14] border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-fade-in-up">
                                <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setFilterGameId('all'); setIsFilterDropdownOpen(false); }}
                                        className={`w-full text-left px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all mb-1 ${filterGameId === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        ALL SECTORS
                                    </button>
                                    <div className="h-px bg-white/5 my-2 mx-4" />
                                    {games.map(game => (
                                        <button
                                            key={game.id}
                                            onClick={() => { setFilterGameId(game.id); setIsFilterDropdownOpen(false); }}
                                            className={`w-full text-left px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all mb-1 ${filterGameId === game.id ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {game.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            {isLoading ? (
                <div className="p-24 text-center">
                    <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Querying Asset Nodes...</p>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="packages-grid" direction="horizontal">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8"
                            >
                                {filteredPackages.length === 0 ? (
                                    <div className="col-span-full p-32 text-center bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
                                        <Gift className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                                        <p className="text-white font-black text-sm uppercase tracking-widest">No matching assets</p>
                                        <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-tight italic">Adjust filters to broaden discovery range</p>
                                    </div>
                                ) : (
                                    filteredPackages.map((pkg, index) => {
                                        const gameObj = pkg.game && typeof pkg.game === 'object' ? (pkg.game as any) : null;
                                        const gameName = typeof pkg.game === 'string' ? pkg.game : gameObj?.name || 'Unknown Game';

                                        return (
                                            <Draggable key={pkg.id} draggableId={pkg.id} index={index} isDragDisabled={!!searchQuery}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            transform: snapshot.isDragging
                                                                ? `${provided.draggableProps.style?.transform} rotate(1.5deg)`
                                                                : provided.draggableProps.style?.transform
                                                        }}
                                                        className={`group relative bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-8 transition-all duration-500 ${snapshot.isDragging ? 'z-50 ring-2 ring-indigo-500 bg-white/[0.1] shadow-2xl transition-none' : 'hover:bg-white/[0.03] hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]'} ${!searchQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                                    >
                                                        <div className="flex items-start justify-between mb-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 transition-transform overflow-hidden ${snapshot.isDragging ? 'rotate-0' : 'group-hover:rotate-6'}`}>
                                                                    {gameObj?.iconUrl ? (
                                                                        <Image
                                                                            src={gameObj.iconUrl}
                                                                            alt=""
                                                                            width={40}
                                                                            height={40}
                                                                            className="rounded-lg object-cover w-full h-full p-2"
                                                                            unoptimized={true}
                                                                        />
                                                                    ) : <Gamepad2 className="w-6 h-6 text-indigo-400" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">{gameName}</p>
                                                                    <p className="text-sm font-black text-white italic truncate max-w-[140px]">{pkg.name}</p>
                                                                    {pkg.isWeeklyPass && (
                                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-widest">Weekly Pass</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 pr-8">
                                                                <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                                    <span className="text-[10px] font-black text-slate-500 tracking-tighter tabular-nums">{pkg.points} pts</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end justify-between mb-8">
                                                            <div>
                                                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Yield Volume</p>
                                                                <p className="text-2xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-sm">{pkg.amount.toLocaleString()}</p>
                                                                {pkg.description && (
                                                                    <p className="text-[9px] text-slate-500 font-medium mt-1 italic">{pkg.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[11px] font-black text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10 mb-2 inline-block">USD</p>
                                                                <p className="text-2xl font-black text-emerald-400 italic tabular-nums">${Number(pkg.price).toFixed(2).split('.')[0]}<span className="text-xs opacity-50">.{Number(pkg.price).toFixed(2).split('.')[1]}</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3">
                                                            <button onClick={() => handleEditClick(pkg)} className="h-12 flex items-center justify-center bg-white/5 hover:bg-indigo-500/20 text-indigo-400 rounded-2xl border border-white/5 transition-all active:scale-95" title="Edit Metadata">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDuplicateClick(pkg)} className="h-12 flex items-center justify-center bg-white/5 hover:bg-purple-500/20 text-purple-400 rounded-2xl border border-white/5 transition-all active:scale-95" title="Duplicate Node">
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeletePackage(pkg.id)} className="h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-red-500 rounded-2xl border border-white/5 transition-all active:scale-95" title="Purge Node">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        )
                                    })
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* Create / Edit Form Modal */}
            {showForm && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020205]/95 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 w-full max-w-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative animate-fade-in-up max-h-[92vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 md:top-10 md:right-10 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-colors z-10">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="mb-8 md:mb-10">
                            <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">
                                {editingPackageId ? "Modify Asset" : (isDuplicating ? "Replicate Asset" : "Deploy Asset")}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">Operational Node Configuration</p>
                        </div>
                        <form onSubmit={handleSubmitPackage} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Visible Asset Identity</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Core System Binding</label>
                                    <div className="relative" ref={formDropdownRef}>
                                        <button type="button" onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)} className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-white flex items-center justify-between hover:bg-white/10 transition-all font-bold text-sm uppercase">
                                            <span className={(formData.gameId ? "text-white" : "text-slate-700")}>{games.find(g => g.id === formData.gameId)?.name || "Select operation sector..."}</span>
                                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-500 ${isFormDropdownOpen ? "rotate-180 text-indigo-400" : ""}`} />
                                        </button>
                                        {isFormDropdownOpen && (
                                            <div className="absolute z-50 top-full mt-4 w-full bg-[#0a0a0f] border border-white/10 rounded-[2rem] shadow-2xl py-4 animate-fade-in max-h-64 overflow-y-auto backdrop-blur-3xl">
                                                {games.map((g) => (
                                                    <button key={g.id} type="button" onClick={() => { setFormData({ ...formData, gameId: g.id }); setIsFormDropdownOpen(false); }} className={`w-full text-left px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 ${formData.gameId === g.id ? "text-indigo-400 bg-indigo-500/5" : "text-slate-500 hover:text-white"}`}>{g.name}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume</label>
                                        <input required type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full px-6 py-4 md:py-5 bg-white/5 border border-white/5 rounded-2xl md:rounded-[2rem] text-white font-bold text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Points</label>
                                        <input required type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} className="w-full px-6 py-4 md:py-5 bg-white/5 border border-white/5 rounded-2xl md:rounded-[2rem] text-purple-400 font-bold text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (USD)</label>
                                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-6 py-4 md:py-5 bg-white/5 border border-white/5 rounded-2xl md:rounded-[2rem] text-emerald-400 font-bold text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal SKU (Provider ID)</label>
                                        <button
                                            type="button"
                                            onClick={handleFetchMooGoldProducts}
                                            disabled={isFetchingMooGold}
                                            className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg disabled:opacity-50"
                                        >
                                            {isFetchingMooGold ? "SYNCING..." : "SYNC FROM MOOGOLD"}
                                        </button>
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={formData.providerSku}
                                        onChange={e => {
                                            setFormData({ ...formData, providerSku: e.target.value });
                                            setShowMooGoldDropdown(false);
                                        }}
                                        onFocus={() => {
                                            if (mooGoldProducts.length > 0) setShowMooGoldDropdown(true);
                                        }}
                                        className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-indigo-400 font-mono text-[11px] uppercase placeholder-slate-700"
                                        placeholder="e.g. mlbb_weekly_pass"
                                    />
                                    {showMooGoldDropdown && mooGoldProducts.length > 0 && (
                                        <div className="absolute z-50 top-full mt-2 w-full bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl py-2 max-h-48 overflow-y-auto backdrop-blur-3xl custom-scrollbar">
                                            {mooGoldProducts.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        const pSku = p.product_id || p.pid || '';
                                                        setFormData({
                                                            ...formData,
                                                            providerSku: pSku.toString(),
                                                            price: p.price || formData.price,
                                                            name: formData.name || p.product_name || p.title || formData.name
                                                        });
                                                        setShowMooGoldDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 text-slate-400 hover:text-white border-b border-white/5 last:border-0 flex justify-between group"
                                                >
                                                    <span className="truncate mr-4">{p.product_name || p.title || `Product ${p.product_id || p.pid}`}</span>
                                                    <span className="text-indigo-400 group-hover:text-indigo-300 shrink-0">{p.product_id || p.pid}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] cursor-pointer hover:bg-white/[0.05] transition-all group">
                                        <input
                                            type="checkbox"
                                            checked={formData.isWeeklyPass}
                                            onChange={(e) => setFormData({ ...formData, isWeeklyPass: e.target.checked })}
                                            className="w-5 h-5 rounded-lg border-2 border-white/10 bg-slate-900 text-indigo-500 focus:ring-offset-0 focus:ring-0"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">Weekly Pass Protocol</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight italic">Enables daily claim rewards UI</span>
                                        </div>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Description</label>
                                        <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-8 py-4 bg-white/5 border border-white/5 rounded-[2rem] text-slate-400 text-sm italic" placeholder="e.g. 80 Instant + 20 Daily x 7 Days" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-6 pt-6">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-[2.5rem] bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] transition-all hover:bg-white/10 hover:text-white">Cancel</button>
                                <button disabled={isSaving} type="submit" className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] text-[10px] font-black text-white uppercase tracking-[0.3em] disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1">{isSaving ? 'Deploying...' : 'Submit Deployment'}</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body)}
        </div>
    );
}

export default function AdminPackagesPage() {
    return (
        <Suspense fallback={
            <div className="p-24 text-center">
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Loading Protocol...</p>
            </div>
        }>
            <AdminPackagesContent />
        </Suspense>
    );
}
