'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { Save, CheckCircle, Settings, Users, ShieldCheck, CreditCard, Zap, Database, Download, Upload, AlertTriangle } from 'lucide-react';

// ─── All configurable settings grouped by section ────────────────────────────
const settingDefaults: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    group: string;
    hint?: string;
    required?: boolean;
}[] = [
        {
            group: 'Friend Supplier',
            key: 'ENABLE_FRIEND_SUPPLIER',
            label: 'Activate Friend Supplier',
            type: 'toggle',
            placeholder: '',
            hint: 'Enable or disable the Friend Supplier provider',
        },
        {
            group: 'Friend Supplier',
            key: 'FRIEND_SUPPLIER_SECRET',
            label: 'Shared Secret (give this to your friend)',
            placeholder: 'e.g. a long random string like abc123xyz...',
            type: 'password',
            required: true,
            hint: 'Your friend puts this in every request so you know it\'s really them',
        },
        {
            group: 'Friend Supplier',
            key: 'FRIEND_SUPPLIER_API_URL',
            label: "Friend's API URL (optional)",
            placeholder: 'https://friend-system.com/api/order',
            hint: 'Only needed if your friend has their own API. Leave blank if they call you.',
        },
        {
            group: 'Friend Supplier',
            key: 'FRIEND_SUPPLIER_API_KEY',
            label: "Friend's API Key (optional)",
            placeholder: 'Your friend gave you this key',
            type: 'password',
            hint: 'Only needed if your friend has their own API.',
        },
        {
            group: 'Friend Supplier',
            key: 'FRIEND_SUPPLIER_CALLBACK_URL',
            label: 'Callback URL (give this to your friend)',
            placeholder: 'https://yourwebsite.com/api/supplier/fulfill',
            hint: 'This is the URL your friend calls to confirm diamond delivery. Copy this and send it to them.',
        },

        {
            group: 'MooGold Provider',
            key: 'ENABLE_MOOGOLD',
            label: 'Activate MooGold',
            type: 'toggle',
            placeholder: '',
            hint: 'Enable or disable the MooGold provider',
        },
        {
            group: 'MooGold Provider',
            key: 'MOOGOLD_PARTNER_ID',
            label: 'Partner ID',
            placeholder: 'e.g. 123456',
            hint: 'Your Account Partner ID from MooGold Dashboard',
        },
        {
            group: 'MooGold Provider',
            key: 'MOOGOLD_SECRET_KEY',
            label: 'API Secret Key',
            placeholder: 'e.g. moogold_key_123',
            type: 'password',
            hint: 'Used to securely fetch the product catalog',
        },
        {
            group: 'MooGold Provider',
            key: 'MOOGOLD_MARGIN',
            label: 'Profit Margin (Multiplier)',
            placeholder: 'e.g. 1.15',
            hint: 'Multiplies the MooGold cost by this amount when syncing (e.g., 1.15 = 15% profit)',
        },

        // ── Bakong KHQR ──────────────────────────────────────────────────────────
        {
            group: 'Bakong KHQR',
            key: 'BAKONG_ACCOUNT_ID',
            label: 'Bakong Account ID',
            placeholder: 'yourname@aba  or  yourname@aclb',
            required: true,
            hint: 'Format: name@bankcode  (e.g. thoeurnratha@aba)',
        },
        {
            group: 'Bakong KHQR',
            key: 'BAKONG_MERCHANT_NAME',
            label: 'Display Name (shown on QR)',
            placeholder: 'e.g. DAI-GAME Store',
            required: true,
        },
        {
            group: 'Bakong KHQR',
            key: 'BAKONG_MERCHANT_CITY',
            label: 'Merchant City',
            placeholder: 'e.g. Phnom Penh',
            required: true,
        },
        {
            group: 'Bakong KHQR',
            key: 'BAKONG_API_TOKEN',
            label: 'Bakong API Token (optional)',
            placeholder: 'Bearer token from api-bakong.nbc.gov.kh',
            type: 'password',
            hint: 'Needed to verify payments in production',
        },
        {
            group: 'Bakong KHQR',
            key: 'BAKONG_CALLBACK_URL',
            label: 'Webhook / Callback URL (set this in Bakong)',
            placeholder: 'https://yourwebsite.com/api/transactions/bakong-callback',
            hint: 'Copy this URL and set it in your Bakong Dashboard to enable instant delivery.',
        },
    ];

const groupIcons: Record<string, React.ElementType> = {
    'Friend Supplier': Users,
    'Bakong KHQR': CreditCard,
    'MooGold Provider': Zap,
};

// --- Utils ---
const generateRandomKey = (length: number = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const groups = [...new Set(settingDefaults.map((s) => s.group))];
const groupKeys = (group: string) => settingDefaults.filter(s => s.group === group).map(s => s.key);
const requiredKeys = (group: string) => settingDefaults.filter(s => s.group === group && s.required).map(s => s.key);

export default function AdminSettingsPage() {
    const [values, setValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const [settingsData, overviewData] = await Promise.all([
                apiRequest<{ key: string; value: string }[]>('/admin/settings'),
                apiRequest<{ globalStockDiamonds: number }>('/admin/overview')
            ]);

            const map: Record<string, string> = {};
            (settingsData ?? []).forEach(({ key, value }) => { map[key] = value; });
            setValues(map);
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settings = Object.entries(values).map(([key, value]) => ({ key, value }));
            await apiRequest('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Failed to save settings', e);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackup = async () => {
        if (!confirm('This will create a JSON backup of all games, transactions, and settings. Proceed?')) return;
        try {
            await apiRequest('/admin/maintenance/backup', { method: 'POST' });
            alert('Backup created successfully on the server (backups/db_backup.json)');
        } catch (e: any) {
            alert('Backup failed: ' + e.message);
        }
    };

    const handleRestore = async () => {
        if (!confirm('CRITICAL: This will overwrite your current database with the last backup. This cannot be undone. Proceed?')) return;
        try {
            await apiRequest('/admin/maintenance/restore', { method: 'POST' });
            alert('Database restored successfully from backups/db_backup.json');
            window.location.reload();
        } catch (e: any) {
            alert('Restore failed: ' + e.message);
        }
    };


    if (isLoading) {
        return (
            <div className="p-24 text-center">
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Connecting to Configuration Mesh...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in max-w-full pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">System Configuration</h1>
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2">
                        Global Protocol Parameters & API Integration
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4 disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {saved ? (
                        <><CheckCircle className="w-5 h-5 text-white" /><span className="text-xs font-black text-white uppercase tracking-[0.3em]">COMMITTED</span></>
                    ) : (
                        <><Save className="w-5 h-5 text-white" /><span className="text-xs font-black text-white uppercase tracking-[0.3em]">{isSaving ? 'SYNCING...' : 'COMMIT CHANGES'}</span></>
                    )}
                </button>
            </div>

            {/* Provider info note */}
            <div className="flex items-center gap-4 px-8 py-5 rounded-2xl border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status:</span>
                {values['ENABLE_MOOGOLD'] === 'true' && <span className="text-amber-400">MooGold Active</span>}
                {values['ENABLE_MOOGOLD'] === 'true' && values['ENABLE_FRIEND_SUPPLIER'] === 'true' && <span className="opacity-20">+</span>}
                {values['ENABLE_FRIEND_SUPPLIER'] === 'true' && <span className="text-purple-400">Friend Supplier Active</span>}
                {values['ENABLE_MOOGOLD'] !== 'true' && values['ENABLE_FRIEND_SUPPLIER'] !== 'true' && <span className="text-red-400">No Provider Active (Manual Mode)</span>}
                <span className="ml-auto opacity-40">Payments via Bakong KHQR</span>
            </div>

            <div className="grid grid-cols-1 gap-10">

                {groups.map((group) => {
                    const GroupIcon = groupIcons[group] || Settings;
                    const fields = settingDefaults.filter((s) => s.group === group);
                    const reqKeys = requiredKeys(group);

                    const isConfigured = reqKeys.length > 0
                        ? reqKeys.every(k => (values[k] ?? '').trim().length > 0)
                        : (fields.some(f => (values[f.key] ?? '').trim().length > 0)); // At least one field filled for optional groups

                    return (
                        <div key={group} className="relative bg-white/[0.02] rounded-[3rem] border border-white/5 p-10 overflow-hidden group/card shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-700">
                                <GroupIcon className="w-40 h-40 text-indigo-500" />
                            </div>

                            {/* Section Header */}
                            <div className="relative flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                                        <GroupIcon className={`w-6 h-6 ${isConfigured ? 'text-emerald-400' : 'text-indigo-400'}`} />
                                    </div>
                                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{group}</h2>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${isConfigured
                                    ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                    : 'bg-red-500/5 text-red-400 border-red-500/20'
                                    }`}>
                                    {isConfigured ? 'Configuration Ready' : 'Incomplete Setup'}
                                </div>
                            </div>

                            {/* Fields Grid */}
                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {fields.map(({ key, label, placeholder, type, hint, required }) => (
                                    <div key={key} className="space-y-3">
                                        <div className="flex justify-between items-baseline px-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {label}
                                                {required && <span className="ml-1 text-red-500">*</span>}
                                            </label>
                                            {hint && <span className="text-[8px] text-indigo-400/50 italic font-black uppercase tracking-tighter">{hint}</span>}
                                        </div>
                                        <div className="relative group/input">
                                            {type === 'toggle' ? (
                                                <button
                                                    onClick={() => setValues(prev => ({ ...prev, [key]: (prev[key] === 'true' ? 'false' : 'true') }))}
                                                    className={`w-14 h-7 rounded-full transition-all duration-300 relative border border-white/10 ${values[key] === 'true' ? 'bg-indigo-600' : 'bg-white/5'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ${values[key] === 'true' ? 'left-8' : 'left-1'
                                                        }`} />
                                                </button>
                                            ) : (
                                                <>
                                                    <input
                                                        type={type ?? 'text'}
                                                        value={values[key] ?? ''}
                                                        onChange={(e) =>
                                                            setValues((prev) => ({ ...prev, [key]: e.target.value }))
                                                        }
                                                        placeholder={placeholder}
                                                        className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white font-bold text-sm placeholder-slate-700 focus:outline-none focus:ring-2 transition-all ${required && !(values[key] ?? '').trim()
                                                            ? 'border-red-500/20 focus:ring-red-500/30'
                                                            : 'border-white/5 focus:ring-indigo-500/30 focus:border-indigo-500/20'
                                                            }`}
                                                    />
                                                    {key === 'FRIEND_SUPPLIER_SECRET' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setValues(prev => ({ ...prev, [key]: generateRandomKey() }))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-[9px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20 transition-all opacity-0 group-hover/input:opacity-100"
                                                        >
                                                            Generate
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* --- Maintenance Section --- */}
                <div className="relative bg-red-500/[0.02] rounded-[3rem] border border-red-500/10 p-10 overflow-hidden group/card shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Database className="w-40 h-40 text-red-500" />
                    </div>

                    <div className="relative flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner">
                                <Database className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Maintenance & Safety</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Data persistence and recovery protocols</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Backup */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/opt">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <Download className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Full System Backup</h3>
                                    <p className="text-[10px] text-slate-500 font-bold">Snapshot of all core logic data</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                                Generates a secure JSON dump of games, packages, transactions, and system settings. Stored on the server volume for emergency recovery.
                            </p>
                            <button
                                onClick={handleBackup}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                            >
                                Trigger Backup
                            </button>
                        </div>

                        {/* Restore */}
                        <div className="p-6 rounded-3xl bg-red-500/[0.03] border border-red-500/10 hover:border-red-500/20 transition-all group/opt">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Emergency Restore</h3>
                                    <p className="text-[10px] text-slate-500 font-bold">Overwrite database state</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                                <AlertTriangle className="inline w-3 h-3 text-red-500 mr-1" />
                                <strong>Warning:</strong> This will delete all current data and replace it with the latest backup. Only use if the system state is corrupted.
                            </p>
                            <button
                                onClick={handleRestore}
                                className="w-full py-3 border border-red-500/30 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Execute Restore
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
