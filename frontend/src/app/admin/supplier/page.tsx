'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import {
    Users, Copy, RefreshCw, Eye, EyeOff, CheckCircle,
    Wifi, WifiOff, AlertCircle, Key, Send,
    Terminal, BookOpen, Zap, ShieldCheck, ClipboardCopy, Globe
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateSecret = (length = 64) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, val => chars[val % chars.length]).join('');
    }
    // Fallback if crypto is unavailable
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Derive the real backend root from NEXT_PUBLIC_API_URL
// e.g. "http://localhost:4000/api" → "http://localhost:4000"
const getBackendRoot = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    // Strip trailing /api (with or without trailing slash)
    return raw.replace(/\/api\/?$/, '');
};


// ─── Copy Field ───────────────────────────────────────────────────────────────
function CopyField({
    label, value, id, mono = true, obfuscate = false, onCopy
}: {
    label: string; value: string; id: string; mono?: boolean; obfuscate?: boolean;
    onCopy: (text: string, label: string) => void;
}) {
    const [visible, setVisible] = useState(false);

    const display = obfuscate && !visible
        ? '•'.repeat(Math.min(value.length, 40))
        : value;

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 min-w-0">
                    <span className={`flex-1 text-sm text-white truncate ${mono ? 'font-mono' : 'font-bold'}`}>
                        {display || <span className="text-slate-600 italic">Not set</span>}
                    </span>
                </div>
                {obfuscate && (
                    <button
                        onClick={() => setVisible(v => !v)}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                        title={visible ? 'Hide' : 'Reveal'}
                    >
                        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
                <button
                    onClick={() => onCopy(value, label)}
                    disabled={!value}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all text-slate-400 hover:text-indigo-400 disabled:opacity-30 active:scale-95"
                    title="Copy to clipboard"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, id, onCopy }: { code: string; id: string; onCopy: (text: string, label: string) => void }) {
    return (
        <div className="relative group">
            <pre className="bg-[#0a0910] border border-white/10 rounded-2xl p-5 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                {code}
            </pre>
            <button
                onClick={() => onCopy(code, "Code snippet")}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-indigo-500/20 transition-all text-slate-400 hover:text-indigo-400 active:scale-95"
            >
                <ClipboardCopy className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierApiPage() {
    const [secret, setSecret] = useState('');
    const [savedSecret, setSavedSecret] = useState('');
    const [callbackUrl, setCallbackUrl] = useState('');
    const [savedCallbackUrl, setSavedCallbackUrl] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; submessage: string; type: 'success' | 'error' } | null>(null);

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');

    // ── Load settings from DB ─────────────────────────────────────────────────
    const fetchSettings = useCallback(async () => {
        try {
            const settings = await apiRequest<{ key: string; value: string }[]>('/admin/settings');
            const map: Record<string, string> = {};
            (settings ?? []).forEach(s => { map[s.key] = s.value; });

            const secret = map['FRIEND_SUPPLIER_SECRET'] ?? '';
            const savedCb = map['FRIEND_SUPPLIER_CALLBACK_URL'] ?? '';

            setSavedSecret(secret);
            setSecret(secret);
            setSavedCallbackUrl(savedCb);

            // Derive sensible default if not yet saved
            const defaultCb = savedCb || `${getBackendRoot()}/api/supplier/fulfill`;
            setCallbackUrl(defaultCb);
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    // ── Save both secret + callback URL in one go ─────────────────────────────
    const handleCopy = async (text: string, label: string) => {
        if (!text || text.includes('...') || text === "") {
            showToast("Error", `Empty value! Please save your configuration first.`, 'error');
            return;
        }

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                showToast("Copied Success!", `${label} has been copied to your clipboard.`);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    showToast("Copied Success!", `${label} has been copied to your clipboard.`);
                } else {
                    throw new Error('Fallback copy failed');
                }
            }
        } catch (err) {
            console.error('Copy failed:', err);
            showToast("Error", "Unable to copy. Please try manually selecting the text.", 'error');
        }
    };

    const showToast = (message: string, submessage: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, submessage, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Save both secret + callback URL in one go ─────────────────────────────
    const handleSave = async () => {
        if (!secret.trim()) return;
        setIsSaving(true);
        try {
            const settingsToSave = [
                { key: 'FRIEND_SUPPLIER_SECRET', value: secret.trim() },
                { key: 'FRIEND_SUPPLIER_CALLBACK_URL', value: callbackUrl.trim() },
            ];
            await apiRequest('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: settingsToSave }),
            });
            setSavedSecret(secret.trim());
            setSavedCallbackUrl(callbackUrl.trim());
            setSaved(true);
            showToast("Config Saved!", "Supplier credentials updated successfully.");
            setTimeout(() => setSaved(false), 3000);
        } catch (error: any) {
            showToast("Failed to Save", error.message || "Please check your connection.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Connection test: hits GET /api/supplier/info with the saved secret ────
    const handleTestConnection = async () => {
        if (!savedSecret) {
            setTestMessage('No secret saved yet. Generate and save a secret first.');
            setTestStatus('fail');
            return;
        }
        setTestStatus('testing');
        setTestMessage('');
        try {
            // Use the saved callback URL to derive the test URL so it matches production
            const base = savedCallbackUrl
                ? savedCallbackUrl.replace('/supplier/fulfill', '')
                : `${getBackendRoot()}/api`;
            const infoUrl = `${base}/supplier/info`;

            const res = await fetch(infoUrl, {
                headers: { 'X-Supplier-Token': savedSecret },
            });
            if (res.ok) {
                setTestStatus('ok');
                setTestMessage('Connection verified ✅ — Your friend can use this secret.');
            } else {
                setTestStatus('fail');
                setTestMessage(`Connection failed (HTTP ${res.status}). Check your backend is running.`);
            }
        } catch {
            setTestStatus('fail');
            setTestMessage('Could not reach the backend. Make sure the server is running and the URL is correct.');
        }
    };

    const isDirty = secret !== savedSecret || callbackUrl !== savedCallbackUrl;
    const fulfillUrl = callbackUrl || `${getBackendRoot()}/api/supplier/fulfill`;
    const infoUrl = fulfillUrl.replace('/fulfill', '/info');
    const token = savedSecret || '<YOUR_SECRET_HERE>';

    // ── Code snippets (clean, no extra indentation) ───────────────────────────
    const curlExample =
        `curl -X POST "${fulfillUrl}" \\
        -H "Content-Type: application/json" \\
        -H "X-Supplier-Token: ${token}" \\
        -d '{
            "orderId": "txn_abc123",
            "status": "success",
            "providerRef": "FRIEND-REF-001",
            "diamonds": 100,
            "message": "Delivered 100 diamonds to player"
        }'`;

    const pythonExample =
        `import requests

        TOKEN = "${token}"
        URL   = "${fulfillUrl}"

        payload = {
            "orderId":     "txn_abc123",    # transaction ID from DAI-GAME
            "status":      "success",        # success | failed | pending
            "providerRef": "FRIEND-REF-001",
            "diamonds":    100,
            "message":     "Delivered 100 diamonds"
        }

        response = requests.post(URL, json=payload, headers={
            "X-Supplier-Token": TOKEN
        })
        print(response.json())`;

    const nodeExample =
        `const TOKEN = "${token}";
        const URL   = "${fulfillUrl}";

        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Supplier-Token": TOKEN,
            },
            body: JSON.stringify({
            orderId:     "txn_abc123",   // transaction ID from DAI-GAME
            status:      "success",       // success | failed | pending
            providerRef: "FRIEND-REF-001",
            diamonds:    100,
            message:     "Delivered 100 diamonds",
        }),
        })
        .then(r => r.json())
        .then(console.log);`;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-24 text-center">
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Loading Supplier Config...</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-10 animate-fade-in max-w-full pb-20">

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Friend Supplier API</h1>
                        </div>
                        <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase">
                            Manage your shared secret · Set public URLs · Give your friend the integration guide
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${savedSecret
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                        {savedSecret ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {savedSecret ? 'Secret Configured' : 'Not Configured'}
                    </div>
                </div>

                {/* ── Section 1: Credentials ──────────────────────────────────── */}
                <div className="relative bg-white/[0.02] rounded-[3rem] border border-white/5 p-10 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Key className="w-40 h-40 text-indigo-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <Key className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white italic tracking-tight uppercase">Credentials &amp; Endpoints</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                Generate your secret · Set your public server URL · Save &amp; share with your friend
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Secret */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Shared Secret Token <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={secret}
                                    onChange={e => setSecret(e.target.value)}
                                    placeholder="Click 'Generate' to create a cryptographically secure secret..."
                                    className="flex-1 font-mono text-sm bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                                />
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/5 group"
                                >
                                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    Generate
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                                Your friend puts this in the <code className="text-purple-400">X-Supplier-Token</code> header of every request
                            </p>
                        </div>

                        {/* Callback / Public URL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                Public Callback URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={callbackUrl}
                                onChange={e => setCallbackUrl(e.target.value)}
                                placeholder="https://your-domain.com/api/supplier/fulfill"
                                className="w-full font-mono text-sm bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                            />
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                                This is the URL your friend calls when they deliver diamonds — must be your real public server URL, not localhost
                            </p>
                        </div>

                        {/* Unsaved warning */}
                        {isDirty && (secret || callbackUrl) && (
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <AlertCircle className="w-3 h-3" />
                                Unsaved changes — click Save to apply
                            </p>
                        )}

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !secret.trim() || !isDirty}
                            className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-0.5 active:scale-95 font-black text-xs text-white uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {saved
                                ? <><CheckCircle className="w-4 h-4 text-emerald-300" /><span>Saved!</span></>
                                : <><Key className="w-4 h-4" /><span>{isSaving ? 'Saving...' : 'Save Config'}</span></>
                            }
                        </button>

                        {/* Quick-copy row (shown once saved) */}
                        {savedSecret && (
                            <div className="mt-4 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CopyField label="Secret Token" value={savedSecret} id="secret-copy" obfuscate onCopy={handleCopy} />
                                <CopyField label="Fulfillment URL" value={fulfillUrl} id="callback-copy" onCopy={handleCopy} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Section 2: Connection Test ──────────────────────────────── */}
                <div className="relative bg-white/[0.02] rounded-[3rem] border border-white/5 p-10 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Wifi className="w-40 h-40 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <Wifi className={`w-5 h-5 ${testStatus === 'ok' ? 'text-emerald-400' : testStatus === 'fail' ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white italic tracking-tight uppercase">Connection Test</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                Verify your secret works against the live endpoint
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <button
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing'}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-50
                            ${testStatus === 'ok'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : testStatus === 'fail'
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                }`}
                        >
                            {testStatus === 'testing' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                            {testStatus === 'ok' && <CheckCircle className="w-4 h-4" />}
                            {testStatus === 'fail' && <WifiOff className="w-4 h-4" />}
                            {testStatus === 'idle' && <Zap className="w-4 h-4" />}
                            {testStatus === 'testing' ? 'Testing...' : testStatus === 'ok' ? 'Connected!' : 'Test Connection'}
                        </button>

                        {testMessage && (
                            <p className={`text-xs font-bold ${testStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {testMessage}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Test Endpoint (GET)</span>
                            <p className="text-slate-300 font-mono mt-2 break-all">{infoUrl}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Fulfillment Endpoint (POST)</span>
                            <p className="text-slate-300 font-mono mt-2 break-all">{fulfillUrl}</p>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Integration Guide ────────────────────────────── */}
                <div className="relative bg-white/[0.02] rounded-[3rem] border border-white/5 p-10 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <BookOpen className="w-40 h-40 text-purple-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <BookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white italic tracking-tight uppercase">Integration Guide</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                Ready-to-run code — copy &amp; send to your friend
                                {!savedSecret && <span className="ml-2 text-amber-400">· Save your secret first to fill in the real token</span>}
                            </p>
                        </div>
                    </div>

                    {/* Request body reference */}
                    <div className="mb-8 p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Send className="w-3.5 h-3.5" />
                            Request body fields
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                { field: 'orderId', type: 'string', required: true, note: 'Transaction ID from DAI-GAME (given per order)' },
                                { field: 'status', type: '"success" | "failed" | "pending"', required: true, note: 'Delivery outcome' },
                                { field: 'providerRef', type: 'string', required: false, note: "Friend's own reference/receipt number" },
                                { field: 'diamonds', type: 'number', required: false, note: 'How many diamonds were delivered' },
                                { field: 'message', type: 'string', required: false, note: 'Optional note for the order log' },
                            ].map(({ field, type, required, note }) => (
                                <div key={field} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <code className="text-emerald-400 font-mono text-xs font-black">{field}</code>
                                        {required && <span className="text-[8px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full">required</span>}
                                    </div>
                                    <p className="text-[9px] text-purple-400 font-mono">{type}</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-snug">{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Code tabs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit">
                            {(['curl', 'python', 'node'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Terminal className="w-3 h-3" />
                                    {tab === 'node' ? 'Node.js' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'curl' && <CodeBlock code={curlExample} id="curl-block" onCopy={handleCopy} />}
                        {activeTab === 'python' && <CodeBlock code={pythonExample} id="python-block" onCopy={handleCopy} />}
                        {activeTab === 'node' && <CodeBlock code={nodeExample} id="node-block" onCopy={handleCopy} />}
                    </div>

                    {/* Example response */}
                    <div className="mt-8 space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Example success response</p>
                        <CodeBlock code={`{
  "success": true,
  "data": {
    "success": true,
    "message": "Diamonds delivered successfully! Ref: FRIEND-REF-001"
  }
}`} id="response-block" onCopy={handleCopy} />
                    </div>

                    {/* Security note */}
                    <div className="mt-8 flex items-start gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Security</p>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                The <code className="text-amber-300 font-mono">X-Supplier-Token</code> is your shared secret — keep it private.
                                Never commit it to Git or post it publicly. If it leaks, click <strong className="text-white">Generate</strong> to rotate it immediately, save, and send the new key to your friend.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Toast Notification */}
            {toast && (
                <div className="fixed top-8 right-8 z-[110] animate-toast-in">
                    <div className={`${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 text-white min-w-[320px] border border-white/10 glow-purple`}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            {toast.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black uppercase tracking-widest">{toast.message}</p>
                            <p className="text-[10px] font-bold opacity-80 leading-relaxed">{toast.submessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-[#07060e]/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowConfirmModal(false)}
                    />
                    <div className="relative bg-[#12111d] border border-white/10 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-scale-in overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />

                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-500/5">
                                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin-slow" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-wider">Regenerate Secret?</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                    Changing this secret will <span className="text-indigo-400 font-bold">disconnect</span> your current supplier integration.
                                    You will need to save the changes and provide the new secret to your friend.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setSecret(generateSecret());
                                        setShowConfirmModal(false);
                                        showToast("Secret Generated", "Click 'Save Config' to apply your new secret.");
                                    }}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-indigo-600/20"
                                >
                                    Confirm & Generate
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
