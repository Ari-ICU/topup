'use client';

import { useState, useEffect } from 'react';
import {
    Key,
    RefreshCcw,
    Copy,
    Check,
    ShieldAlert,
    Terminal,
    Code2,
    Save,
    ExternalLink,
    Users,
    Trash2,
    Plus,
    Mail,
    ChevronRight,
    Search,
    Play,
    Terminal as TerminalIcon,
    AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface ApiKeys {
    userId: string;
    publicKey: string;
    partnerId: string;
    secretKey: string;
    fullSecretKey?: string;
}

interface Reseller {
    id: string;
    email: string;
    name?: string;
    userId: string;
    partnerId: string;
    secretKey: string;
    fullSecretKey?: string;
    isActive: boolean;
    createdAt: string;
}

interface Package {
    id: string;
    name: string;
    game?: { name: string };
}

export default function AdminApiKeyPage() {
    const [activeTab, setActiveTab] = useState<'master' | 'resellers'>('master');
    const [keys, setKeys] = useState<ApiKeys>({ userId: '', publicKey: '', partnerId: '', secretKey: '', fullSecretKey: '' });
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [customSecret, setCustomSecret] = useState('');
    const [resellerEmail, setResellerEmail] = useState('');
    const [resellerName, setResellerName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatingReseller, setIsCreatingReseller] = useState(false);

    // Testing State
    const [testPackageId, setTestPackageId] = useState('cmmhk8abo000vs20iln37614t');
    const [testPlayerId, setTestPlayerId] = useState('12345678');
    const [testZoneId, setTestZoneId] = useState('2001');
    const [testResponse, setTestResponse] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Modal state
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        description: React.ReactNode;
        variant: 'info' | 'danger' | 'warning' | 'success';
        isAlert?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info',
        onConfirm: () => { }
    });

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    const fetchKeys = async () => {
        try {
            const [keysData, resellersData, packagesData] = await Promise.all([
                apiRequest<ApiKeys>('/admin/api-keys'),
                apiRequest<Reseller[]>('/admin/resellers'),
                apiRequest<Package[]>('/admin/packages')
            ]);

            if (keysData) setKeys(keysData);
            if (resellersData) setResellers(resellersData || []);
            if (packagesData) {
                setPackages(packagesData);
                if (packagesData.length > 0) setTestPackageId(packagesData[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch API data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const generateKeys = async () => {
        setCustomSecret(''); // Reset
        setModal({
            isOpen: true,
            title: 'Create Master Key',
            description: (
                <div className="space-y-4 pt-2">
                    <p>Are you sure? Generating new keys will immediately invalidate your current Reseller API connection!</p>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Optional: Custom Secret</label>
                        <input
                            type="text"
                            placeholder="e.g. MY_SECRET_123"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-indigo-500 transition-all"
                            onChange={(e) => setCustomSecret(e.target.value)}
                        />
                    </div>
                </div>
            ),
            variant: 'danger',
            onConfirm: async () => {
                const s = (document.querySelector('input[placeholder="e.g. MY_SECRET_123"]') as HTMLInputElement)?.value;
                closeModal();
                setIsGenerating(true);
                try {
                    const response = await apiRequest<ApiKeys>('/admin/api-keys/generate', {
                        method: 'POST',
                        body: JSON.stringify({ customSecret: s })
                    });
                    if (response) {
                        setKeys(response);
                        setModal({
                            isOpen: true,
                            title: 'Generation Successful',
                            description: 'New API keys generated successfully. Please save the Secret Key now, as it will be masked later!',
                            variant: 'success',
                            isAlert: true,
                            onConfirm: closeModal
                        });
                    }
                } catch (error) {
                    setModal({
                        isOpen: true,
                        title: 'Generation Failed',
                        description: 'Failed to generate new API keys. Please try again later.',
                        variant: 'danger',
                        isAlert: true,
                        onConfirm: closeModal
                    });
                } finally {
                    setIsGenerating(false);
                }
            }
        });
    };

    const createReseller = async () => {
        if (!resellerEmail) return;
        setIsCreatingReseller(true);
        try {
            const response = await apiRequest<Reseller>('/admin/resellers', {
                method: 'POST',
                body: JSON.stringify({ email: resellerEmail, name: resellerName })
            });
            if (response) {
                setResellers(prev => [response, ...prev]);
                setResellerEmail('');
                setResellerName('');
                setModal({
                    isOpen: true,
                    title: 'Reseller Created',
                    description: 'The new reseller has been registered and API keys generated.',
                    variant: 'success',
                    isAlert: true,
                    onConfirm: closeModal
                });
            }
        } catch (error: any) {
            setModal({
                isOpen: true,
                title: 'Operation Failed',
                description: error.message || 'Failed to create reseller.',
                variant: 'danger',
                isAlert: true,
                onConfirm: closeModal
            });
        } finally {
            setIsCreatingReseller(false);
        }
    };

    const deleteReseller = async (id: string) => {
        setModal({
            isOpen: true,
            title: 'Remove Reseller',
            description: 'Are you sure? This will immediately disable their API access and cannot be undone.',
            variant: 'danger',
            onConfirm: async () => {
                closeModal();
                try {
                    await apiRequest(`/admin/resellers/${id}`, { method: 'DELETE' });
                    setResellers(prev => prev.filter(r => r.id !== id));
                } catch (error: any) {
                    console.error('Delete failed:', error);
                }
            }
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const runApiTest = async () => {
        setIsTesting(true);
        setTestResponse(null);
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/reseller/order`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': keys.partnerId || keys.publicKey,
                    'X-API-Secret': keys.fullSecretKey || keys.secretKey
                },
                body: JSON.stringify({
                    packageId: testPackageId,
                    playerInfo: {
                        playerId: testPlayerId,
                        zoneId: testZoneId
                    }
                })
            });
            const data = await response.json();
            setTestResponse({ status: response.status, data });
        } catch (error: any) {
            setTestResponse({ status: 'Error', data: { message: error.message } });
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
                <button
                    onClick={() => setActiveTab('master')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'master' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Master Key
                </button>
                <button
                    onClick={() => setActiveTab('resellers')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resellers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Manage Resellers
                </button>
            </div>

            {activeTab === 'master' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    <Key className="w-5 h-5 text-rose-500" />
                                </div>
                                <h2 className="text-xl font-black text-white italic tracking-widest uppercase">Master API Credentials</h2>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                                Use these credentials for your core system integrations.
                                These serve as the master access for all API operations.
                            </p>
                        </div>

                        <button
                            onClick={generateKeys}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-900/20 uppercase tracking-widest group"
                        >
                            <Key className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Generating...' : 'Create Master Key'}
                        </button>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider">Security Warning</h4>
                            <p className="text-amber-500/70 text-xs leading-relaxed">
                                Your **Master Secret Key** is highly sensitive. It provides full access to your administrative functions and wallet.
                                Generating new keys will <strong>invalidate</strong> the old ones immediately.
                            </p>
                        </div>
                    </div>

                    {/* Keys Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User ID */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-4 hover:border-emerald-500/30 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">User ID</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(keys.userId, 'user')}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {copied === 'user' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-4 font-mono text-sm text-emerald-300 break-all border border-white/5 group-hover:border-emerald-500/20 transition-colors text-center font-bold text-lg">
                                {keys.userId || '---'}
                            </div>
                        </div>

                        {/* Partner ID */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-4 hover:border-indigo-500/30 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Partner ID</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(keys.partnerId || keys.publicKey, 'partner')}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {copied === 'partner' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-4 font-mono text-xs text-indigo-300 break-all border border-white/5 group-hover:border-indigo-500/20 transition-colors h-[60px] flex items-center">
                                {keys.partnerId || keys.publicKey || 'Not generated yet'}
                            </div>
                        </div>

                        {/* Secret Key */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-4 hover:border-rose-500/30 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(keys.fullSecretKey || keys.secretKey, 'secret')}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {copied === 'secret' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-4 font-mono text-sm text-rose-300 break-all border border-white/5 group-hover:border-rose-500/20 transition-colors h-[60px] flex items-center justify-center font-bold tracking-widest">
                                {keys.secretKey || 'Not generated yet'}
                            </div>
                        </div>
                    </div>

                    {/* Live API Tester Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Guide Snippet */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-300">
                            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-white font-bold text-xs uppercase tracking-widest italic">Developer Endpoint</h4>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Live API v1</span>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                {/* Get Packages */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-500 text-[10px] font-black rounded uppercase">GET</span>
                                            <code className="text-slate-300 text-xs">/api/reseller/packages</code>
                                        </div>
                                        <span className="text-[10px] text-slate-500 italic">Fetch Catalog</span>
                                    </div>
                                    <div className="bg-black/60 rounded-2xl p-4 border border-white/5 relative group">
                                        <pre className="text-slate-400 text-[10px] font-mono leading-relaxed overflow-x-auto">
                                            {`{
                                                "success": true,
                                                "data": [
                                                    { "id": "pkg_123", "name": "5 Diamonds", "game": "Mobile Legends", "price": "5.00" }
                                                ]
                                            }`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Place Order */}
                                <div className="space-y-3 border-t border-white/5 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded uppercase">POST</span>
                                            <code className="text-slate-300 text-xs">/api/reseller/order</code>
                                        </div>
                                        <span className="text-[10px] text-slate-500 italic">Submit Top-up</span>
                                    </div>
                                    <div className="bg-black/60 rounded-2xl p-6 border border-white/5 relative group">
                                        <pre className="text-indigo-300/90 text-xs font-mono leading-relaxed overflow-x-auto">
                                            {`{
                                                "packageId": "pkg_unique_id",
                                                "playerInfo": { "playerId": "12345678", "zoneId": "2001" }
                                            }`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-rose-400">
                                            <Save className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Headers Required</span>
                                        </div>
                                        <ul className="text-slate-500 text-[10px] space-y-1 font-medium">
                                            <li>• X-API-Key: {keys.partnerId || (keys.publicKey ? keys.publicKey.substring(0, 10) + "..." : "---")}</li>
                                            <li>• X-API-Secret: [Your Secret]</li>
                                            <li>• Content-Type: application/json</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Base URL</span>
                                        </div>
                                        <code className="text-slate-500 text-[10px] block truncate">
                                            {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : 'https://yourdomain.com/api'}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test Form */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center justify-between underline-offset-4">
                                <div className="flex items-center gap-2">
                                    <Play className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-white font-bold text-xs uppercase tracking-widest italic">Connection Tester</h3>
                                </div>
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/20">Using Master Key</span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 h-full">
                                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Select Package</label>
                                        <select
                                            value={testPackageId}
                                            onChange={(e) => setTestPackageId(e.target.value)}
                                            className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500/30 appearance-none cursor-pointer"
                                        >
                                            {packages.map(p => (
                                                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                                    {(p as any).game?.name ? `${(p as any).game.name} - ` : ''}{p.name}
                                                </option>
                                            ))}
                                            {packages.length === 0 && <option value="">No packages available</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Player ID</label>
                                        <input
                                            value={testPlayerId}
                                            onChange={(e) => setTestPlayerId(e.target.value)}
                                            className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500/30"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Zone ID (Optional)</label>
                                    <input
                                        value={testZoneId}
                                        onChange={(e) => setTestZoneId(e.target.value)}
                                        className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500/30"
                                    />
                                </div>

                                <button
                                    onClick={runApiTest}
                                    disabled={isTesting || !keys.partnerId}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/10"
                                >
                                    {isTesting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    Run Test Request
                                </button>
                            </div>

                            {testResponse && (
                                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <TerminalIcon className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Response Output</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${testResponse.status === 200 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            Status: {testResponse.status}
                                        </span>
                                    </div>
                                    <div className="bg-black/60 rounded-2xl p-4 border border-white/5 max-h-[150px] overflow-y-auto">
                                        <pre className="text-[10px] font-mono leading-relaxed text-indigo-300/80 whitespace-pre-wrap">
                                            {JSON.stringify(testResponse.data, null, 2)}
                                        </pre>
                                    </div>
                                    {testResponse.data?.success === false && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/5 border border-rose-500/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-300">
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                            <p className="text-[9px] text-rose-500 font-bold">
                                                {testResponse.data.message || 'Operation failed. Check keys or balance.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Reseller Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-black text-white italic tracking-widest uppercase">Multi-Reseller Management</h2>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                                Create and manage unique API credentials for each reseller.
                                Track their activity and revoke access individually.
                            </p>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/5">
                        <div className="flex items-center gap-2 mb-8">
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Register New Reseller</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center text-slate-600 group-focus-within:text-emerald-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="partner@example.com"
                                        value={resellerEmail}
                                        onChange={(e) => setResellerEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Reseller Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Digital Store Inc"
                                    value={resellerName}
                                    onChange={(e) => setResellerName(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/20 transition-all placeholder:text-slate-700"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={createReseller}
                                    disabled={isCreatingReseller || !resellerEmail}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreatingReseller ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Generate Credentials
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Reseller List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Active Resellers ({resellers.length})</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {resellers.filter(r =>
                                r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                r.name?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length === 0 ? (
                                <div className="p-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[2.5rem]">
                                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No resellers found</p>
                                </div>
                            ) : (
                                resellers
                                    .filter(r =>
                                        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        r.name?.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((r) => (
                                        <div key={r.id} className="group relative bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all hover:bg-white/[0.04]">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0 relative">
                                                        <Mail className="w-5 h-5 text-indigo-400" />
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-white font-bold text-sm truncate">{r.email}</h4>
                                                            {r.isActive && (
                                                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black rounded uppercase tracking-tighter">Active</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                            {r.name || 'Anonymous Reseller'} • Registered {new Date(r.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex flex-col gap-1 px-4 py-2 bg-black/40 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group/key" onClick={() => copyToClipboard(r.userId, `u-${r.id}`)}>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">User ID</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-mono font-bold text-emerald-400">{r.userId}</span>
                                                            {copied === `u-${r.id}` ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 text-slate-700 group-hover/key:text-emerald-500" />}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 px-4 py-2 bg-black/40 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group/key" onClick={() => copyToClipboard(r.partnerId, `p-${r.id}`)}>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Partner ID</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-mono font-bold text-indigo-400">{r.partnerId.substring(0, 8)}...</span>
                                                            {copied === `p-${r.id}` ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 text-slate-700 group-hover/key:text-indigo-500" />}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 px-4 py-2 bg-black/40 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer group/key" onClick={() => copyToClipboard(r.fullSecretKey || r.secretKey, `s-${r.id}`)}>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Secret</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-mono font-bold text-rose-400">{r.secretKey}</span>
                                                            {copied === `s-${r.id}` ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 text-slate-700 group-hover/key:text-rose-500" />}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => deleteReseller(r.id)}
                                                        className="p-3 bg-red-500/5 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 rounded-xl transition-all border border-red-500/10 hover:border-red-500/20"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                description={modal.description}
                variant={modal.variant}
                isAlert={modal.isAlert}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
                confirmText={modal.isAlert ? "Got it" : (activeTab === 'master' ? "Rotate Keys" : "Confirm")}
            />
        </div>
    );
}
