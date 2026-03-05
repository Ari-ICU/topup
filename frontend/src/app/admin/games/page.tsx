'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { apiRequest } from '@/lib/api';
import { Edit2, Trash2, PlusCircle, ToggleLeft, ToggleRight, Gamepad2, GripVertical, Search, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Image from 'next/image';

interface Game {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    inputConfig: any;
    isActive: boolean;
    _count?: { packages: number };
}

function AdminGamesContent() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    // Sync local search with URL
    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) setSearchQuery(q);
    }, [searchParams]);

    // Derived State
    const filteredGames = games.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingGameId, setEditingGameId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        iconUrl: '',
        requiresPlayerId: true,
        requiresZoneId: false
    });

    const handleEditClick = (game: Game) => {
        setFormData({
            name: game.name,
            slug: game.slug,
            iconUrl: game.iconUrl || '',
            requiresPlayerId: game.inputConfig?.playerId ? true : false,
            requiresZoneId: game.inputConfig?.zoneId ? true : false
        });
        setEditingGameId(game.id);
        setShowForm(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const data = await apiRequest<{ url: string }>('/admin/upload', {
                method: 'POST',
                body: uploadData,
            });

            if (data?.url) {
                setFormData(prev => ({ ...prev, iconUrl: data.url }));
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const fetchGames = useCallback(async () => {
        try {
            const data = await apiRequest<Game[]>('/admin/games');
            setGames(data ?? []);
        } catch (error) {
            console.error('Failed to fetch games', error);
            setGames([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleToggleActive = async (game: Game) => {
        setTogglingId(game.id);
        try {
            await apiRequest(`/admin/games/${game.id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !game.isActive }),
            });
            setGames((prev) =>
                prev.map((g) => (g.id === game.id ? { ...g, isActive: !g.isActive } : g))
            );
        } catch (error) {
            console.error('Failed to toggle game status', error);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || searchQuery) return;

        const items = Array.from(games);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setGames(items);

        try {
            await apiRequest('/admin/games/reorder', {
                method: 'POST',
                body: JSON.stringify({ ids: items.map(i => i.id) })
            });
        } catch (error) {
            console.error('Failed to update order', error);
            // Revert on error
            fetchGames();
            alert('Failed to update sort order');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this game? This will also remove all its packages.')) return;
        try {
            await apiRequest(`/admin/games/${id}`, { method: 'DELETE' });
            setGames((prev) => prev.filter((g) => g.id !== id));
        } catch (error) {
            console.error('Failed to delete game', error);
            alert('Failed to delete game');
        }
    };

    const handleSubmitGame = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingGameId) {
                const inputConfig: any = {};
                if (formData.requiresPlayerId) inputConfig.playerId = "string";
                if (formData.requiresZoneId) inputConfig.zoneId = "string";

                const updatedGame = await apiRequest<Game>(`/admin/games/${editingGameId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: formData.name,
                        slug: formData.slug,
                        iconUrl: formData.iconUrl || null,
                        inputConfig
                    }),
                });
                setGames((prev) => prev.map(g => g.id === editingGameId ? { ...g, ...updatedGame } : g));
            } else {
                const inputConfig: any = {};
                if (formData.requiresPlayerId) inputConfig.playerId = "string";
                if (formData.requiresZoneId) inputConfig.zoneId = "string";

                const newGame = await apiRequest<Game>('/admin/games', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: formData.name,
                        slug: formData.slug,
                        iconUrl: formData.iconUrl || null,
                        inputConfig,
                        isActive: false
                    }),
                });
                setGames((prev) => [newGame, ...prev]);
            }
            setShowForm(false);
            setEditingGameId(null);
            setFormData({ name: '', slug: '', iconUrl: '', requiresPlayerId: true, requiresZoneId: false });
        } catch (error: any) {
            console.error('Failed to save game', error);
            alert(error.message || 'Failed to save game');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Games</h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">
                        Manage {games.length} games in your catalog
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingGameId(null);
                        setFormData({ name: '', slug: '', iconUrl: '', requiresPlayerId: true, requiresZoneId: false });
                        setShowForm(true);
                    }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] overflow-hidden shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <PlusCircle className="w-5 h-5 text-white" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Add New Game</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className={`p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-md transition-all duration-500 ${searchQuery ? 'ring-1 ring-indigo-500/20' : ''}`}>
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className={`w-4 h-4 transition-colors ${searchQuery ? 'text-indigo-400' : 'text-slate-500 group-focus-within:text-indigo-400'}`} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 bg-white/5 border border-white/5 rounded-2xl text-white text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-white/10 transition-all placeholder:text-slate-700"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-6 flex items-center text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="mt-4 ml-6 text-[9px] font-black text-indigo-400/50 uppercase tracking-[0.2em] animate-pulse">
                        ⚠️ Reordering is disabled when searching
                    </p>
                )}
            </div>

            {/* Create Form Modal */}
            {showForm && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#07060e]/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#111019] border border-white/5 rounded-[3rem] p-10 w-full max-w-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] animate-zoom-in relative overflow-hidden">
                        <button onClick={() => setShowForm(false)} className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-colors">
                            <Gamepad2 className="w-5 h-5" />
                        </button>

                        <div className="relative">
                            <h2 className="text-2xl font-black text-white italic tracking-tight mb-8">
                                {editingGameId ? "Edit Game" : "Add New Game"}
                            </h2>

                            <form onSubmit={handleSubmitGame} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Game Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                                            className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-bold"
                                            placeholder="e.g. VALORANT"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Game Slug</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-mono text-sm placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                                            placeholder="e.g. valorant-global"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Game Icon</label>
                                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                        <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-900 group shrink-0">
                                            {formData.iconUrl ? (
                                                <Image src={formData.iconUrl} alt="Preview" fill className="object-cover" unoptimized={true} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <PlusCircle className="w-8 h-8 text-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full text-xs text-slate-500 file:mr-6 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 transition-all cursor-pointer"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.iconUrl}
                                                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                                                    className="w-full px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 font-medium placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                                                    placeholder="OR Paste external image URL..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Input Configuration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={formData.requiresPlayerId}
                                                onChange={(e) => setFormData({ ...formData, requiresPlayerId: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-2 border-white/10 bg-slate-900 text-indigo-500 focus:ring-offset-0 focus:ring-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Player ID Label</span>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Main Identifier</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={formData.requiresZoneId}
                                                onChange={(e) => setFormData({ ...formData, requiresZoneId: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-2 border-white/10 bg-slate-900 text-purple-500 focus:ring-offset-0 focus:ring-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Zone ID Label</span>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight text-glow-purple">Server/Region</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center gap-6 pt-6 border-t border-white/5">
                                    <button type="button" onClick={() => setShowForm(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] hover:text-white transition-colors">Cancel</button>
                                    <button
                                        disabled={isSaving || isUploading}
                                        type="submit"
                                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSaving ? 'Processing...' : (editingGameId ? 'Update Game' : 'Save Game')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Table Container */}
            <div className="relative bg-white/[0.02] rounded-[2.5rem] border border-white/5 overflow-hidden">
                {isLoading ? (
                    <div className="p-24 text-center">
                        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Loading Games...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.03]">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    <th className="px-8 py-6 w-10"></th>
                                    <th className="px-8 py-6">Game</th>
                                    <th className="px-8 py-6">Slug</th>
                                    <th className="px-8 py-6 text-center">Packages</th>
                                    <th className="px-8 py-6 text-center">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="games-list">
                                    {(provided) => (
                                        <tbody
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="divide-y divide-white/5"
                                        >
                                            {!filteredGames || filteredGames.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-24 text-center">
                                                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                            <Gamepad2 className="w-8 h-8 text-slate-700" />
                                                        </div>
                                                        <p className="text-white font-black text-sm uppercase tracking-widest">No games found</p>
                                                        <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-tight">Add your first game to start.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredGames.map((game, index) => (
                                                    <Draggable key={game.id} draggableId={game.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <tr
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`group ${snapshot.isDragging
                                                                    ? 'bg-indigo-600/20 shadow-[0_20px_60px_-10px_rgba(99,102,241,0.4)] relative z-50 cursor-grabbing scale-[1.02] border-y border-indigo-500/50 ring-1 ring-white/10'
                                                                    : 'transition-all duration-300 hover:bg-white/[0.03] cursor-grab border-y border-transparent'
                                                                    }`}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    display: snapshot.isDragging ? 'table' : 'table-row'
                                                                }}
                                                            >
                                                                <td className="px-8 py-6">
                                                                    <div className={`transition-colors duration-300 ${snapshot.isDragging ? 'text-indigo-400 scale-110' : 'text-slate-700 group-hover:text-indigo-500'}`}>
                                                                        <GripVertical className="w-5 h-5" />
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                                                                            {game.iconUrl ? (
                                                                                <Image src={game.iconUrl} alt={game.name} fill className="object-cover" unoptimized={true} />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                    <Gamepad2 className="w-6 h-6 text-slate-700" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-base font-black text-white italic tracking-tight">{game.name}</p>
                                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Top-up Platform</p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="px-8 py-6">
                                                                    <span className="font-mono text-[11px] text-indigo-400 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                                                                        {game.slug}
                                                                    </span>
                                                                </td>

                                                                <td className="px-8 py-6 text-center">
                                                                    <span className="text-lg font-black text-white tabular-nums">
                                                                        {game._count?.packages ?? 0}
                                                                    </span>
                                                                </td>

                                                                <td className="px-8 py-6 text-center">
                                                                    <button
                                                                        onClick={() => handleToggleActive(game)}
                                                                        disabled={togglingId === game.id}
                                                                        className="mx-auto block group/toggle disabled:opacity-50 h-10 w-10 relative"
                                                                    >
                                                                        {game.isActive ? (
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full scale-75 group-hover/toggle:scale-100 transition-transform" />
                                                                                <ToggleRight className="relative w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                                            </div>
                                                                        ) : (
                                                                            <ToggleLeft className="w-10 h-10 text-slate-700 hover:text-slate-600 transition-colors" />
                                                                        )}
                                                                    </button>
                                                                </td>

                                                                <td className="px-8 py-6 text-right">
                                                                    <div className={`flex justify-end gap-3 ${snapshot.isDragging ? '' : ''}`}>
                                                                        <button
                                                                            onClick={() => handleEditClick(game)}
                                                                            className="w-10 h-10 flex items-center justify-center text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/10 transition-all"
                                                                            title="Edit Game"
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(game.id)}
                                                                            className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/10 transition-all"
                                                                            title="Delete Game"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </tbody>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminGamesPage() {
    return (
        <Suspense fallback={
            <div className="p-24 text-center">
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Loading...</p>
            </div>
        }>
            <AdminGamesContent />
        </Suspense>
    );
}
