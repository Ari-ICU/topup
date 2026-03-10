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
    ExternalLink
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ApiKeys {
    publicKey: string;
    secretKey: string;
}

export default function AdminApiKeyPage() {
    const [keys, setKeys] = useState<ApiKeys>({ publicKey: '', secretKey: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const fetchKeys = async () => {
        try {
            const response = await apiRequest<{ publicKey: string; secretKey: string }>('/admin/api-keys');
            if (response) {
                setKeys(response);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const generateKeys = async () => {
        if (!confirm('Are you sure? Generating new keys will immediately invalidate your current Reseller API connection!')) return;
        
        setIsGenerating(true);
        try {
            const response = await apiRequest<{ publicKey: string; secretKey: string }>('/admin/api-keys/generate', {
                method: 'POST'
            });
            if (response) {
                setKeys(response);
                alert('New API keys generated successfully. Please save the Secret Key now, as it will be masked later!');
            }
        } catch (error) {
            alert('Failed to generate API keys');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <Key className="w-5 h-5 text-rose-500" />
                        </div>
                        <h2 className="text-xl font-black text-white italic tracking-widest uppercase">Reseller API Credentials</h2>
                    </div>
                    <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                        Allow external partners to resell your top-up services via API.
                        Share these keys only with trusted developers.
                    </p>
                </div>
                
                <button
                    onClick={generateKeys}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-900/20 uppercase tracking-widest group"
                >
                    <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {isGenerating ? 'Generating...' : 'Rotate Master Keys'}
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
                        Your **Secret Key** is highly sensitive. Anyone with this key can place orders on your behalf using your wallet balance.
                        Generating new keys will <strong>invalidate</strong> the old ones immediately, cutting off any active resellers until they update.
                    </p>
                    <p className="text-amber-500/50 text-[10px] italic mt-2">
                        Reminder: After rotating keys, you must manually send the new credentials to your partners via Telegram/Support.
                    </p>
                </div>
            </div>

            {/* Keys Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Public Key */}
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-4 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Public Key (X-API-Key)</span>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(keys.publicKey, 'public')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {copied === 'public' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                        </button>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 font-mono text-sm text-indigo-300 break-all border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                        {keys.publicKey || 'Not generated yet'}
                    </div>
                </div>

                {/* Secret Key */}
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-4 hover:border-rose-500/30 transition-colors group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret Key (X-API-Secret)</span>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(keys.secretKey, 'secret')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {copied === 'secret' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                        </button>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 font-mono text-sm text-rose-300 break-all border border-white/5 group-hover:border-rose-500/20 transition-colors">
                        {keys.secretKey || 'Not generated yet'}
                    </div>
                </div>
            </div>

            {/* Integration Guide Snippet */}
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
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded uppercase">POST</span>
                            <code className="text-slate-300 text-xs">/api/reseller/order</code>
                        </div>
                        <div className="bg-black/60 rounded-2xl p-6 border border-white/5 relative group">
                            <pre className="text-indigo-300/90 text-xs font-mono leading-relaxed overflow-x-auto">
{`{
  "packageId": "pkg_unique_id",
  "playerInfo": {
    "playerId": "12345678",
    "zoneId": "2001"
  }
}`}
                            </pre>
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-slate-600 uppercase">Example Payload</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-rose-400">
                                <Save className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Headers Required</span>
                            </div>
                            <ul className="text-slate-500 text-[10px] space-y-1 font-medium">
                                <li>• X-API-Key: {keys.publicKey.substring(0, 10)}...</li>
                                <li>• X-API-Secret: [Your Secret Key]</li>
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
        </div>
    );
}
