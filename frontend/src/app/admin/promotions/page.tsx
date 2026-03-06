'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Promotion } from '@/types';
import { Plus, Trash2, Edit2, MoveVertical, Save, X, ToggleLeft, ToggleRight, Loader2, Image as ImageIcon } from 'lucide-react';

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const data = await apiRequest<Promotion[]>('/admin/promotions');
            setPromotions(data || []);
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingPromo?.title || !editingPromo?.imageUrl) return;
        setSaving(true);
        try {
            if (editingPromo.id) {
                await apiRequest(`/admin/promotions/${editingPromo.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(editingPromo),
                });
            } else {
                await apiRequest('/admin/promotions', {
                    method: 'POST',
                    body: JSON.stringify(editingPromo),
                });
            }
            setEditingPromo(null);
            fetchPromotions();
        } catch (error) {
            console.error('Failed to save promotion:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await apiRequest(`/admin/promotions/${id}`, { method: 'DELETE' });
            fetchPromotions();
        } catch (error) {
            console.error('Failed to delete promotion:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">Marketing <span className="text-indigo-400">Promotions</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Manage landing page banners and special offers.</p>
                </div>
                <button
                    onClick={() => setEditingPromo({ title: '', subtitle: '', imageUrl: '', badgeText: '', badgeColor: 'purple', isActive: true })}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Promotion
                </button>
            </div>

            {editingPromo && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <h2 className="text-xl font-bold text-white italic">{editingPromo.id ? 'Edit Promotion' : 'Create New Promotion'}</h2>
                        <button onClick={() => setEditingPromo(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Title</label>
                            <input
                                type="text"
                                value={editingPromo.title}
                                onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                placeholder="e.g. Weekend Rebate"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Subtitle</label>
                            <input
                                type="text"
                                value={editingPromo.subtitle}
                                onChange={(e) => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                placeholder="e.g. Get up to 50% bonus diamonds"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Image URL</label>
                            <input
                                type="text"
                                value={editingPromo.imageUrl}
                                onChange={(e) => setEditingPromo({ ...editingPromo, imageUrl: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                placeholder="Enter banner URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Link URL</label>
                            <input
                                type="text"
                                value={editingPromo.linkUrl}
                                onChange={(e) => setEditingPromo({ ...editingPromo, linkUrl: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                placeholder="e.g. /topup/mobile-legends"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Badge Text</label>
                            <input
                                type="text"
                                value={editingPromo.badgeText}
                                onChange={(e) => setEditingPromo({ ...editingPromo, badgeText: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                placeholder="e.g. Limited Offer"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Badge Color</label>
                            <select
                                value={editingPromo.badgeColor}
                                onChange={(e) => setEditingPromo({ ...editingPromo, badgeColor: e.target.value as any })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                            >
                                <option value="purple" className="bg-slate-900">Purple (Default)</option>
                                <option value="orange" className="bg-slate-900">Orange (Hot Sale)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            disabled={saving}
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Promotion
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {promotions.map((promo) => (
                    <div key={promo.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="relative w-full sm:w-40 aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-xl">
                            {promo.imageUrl ? (
                                <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="text-slate-600 w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{promo.title}</h3>
                                {promo.badgeText && (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${promo.badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                                        {promo.badgeText}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm font-medium">{promo.subtitle || 'No subtitle'}</p>
                            <p className="text-indigo-400/60 text-[10px] font-bold tracking-widest truncate max-w-[200px]">{promo.linkUrl || 'No link'}</p>
                        </div>
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setEditingPromo(promo)}
                                className="flex-1 sm:flex-none p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                            >
                                <Edit2 className="w-5 h-5 mx-auto" />
                            </button>
                            <button
                                onClick={() => handleDelete(promo.id)}
                                className="flex-1 sm:flex-none p-3 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500/60 hover:text-red-500 transition-all border border-red-500/10"
                            >
                                <Trash2 className="w-5 h-5 mx-auto" />
                            </button>
                        </div>
                    </div>
                ))}

                {promotions.length === 0 && (
                    <div className="col-span-full py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">No active promotions</p>
                        <button
                            onClick={() => setEditingPromo({ title: '', subtitle: '', imageUrl: '', badgeText: '', badgeColor: 'purple', isActive: true })}
                            className="mt-6 text-indigo-400 hover:text-indigo-300 font-black text-sm uppercase tracking-tighter underline underline-offset-4 decoration-2"
                        >
                            Create your first promotion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
