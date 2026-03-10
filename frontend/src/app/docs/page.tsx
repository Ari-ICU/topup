'use client';

import { useState, useEffect } from 'react';
import { 
    Terminal, 
    Code2, 
    ShieldCheck, 
    Zap, 
    Globe, 
    Cpu, 
    Copy, 
    Check, 
    Server,
    Package,
    ArrowRight,
    Search,
    BookOpen,
    Info,
    ChevronRight,
    Command,
    Workflow,
    ShieldAlert
} from 'lucide-react';

interface ApiEndpoint {
    method: string;
    path: string;
    title: string;
    description: string;
    response: string;
    params?: string;
    headers?: Record<string, string>;
}

interface ApiCategory {
    category: string;
    description: string;
    auth?: string;
    endpoints: ApiEndpoint[];
}

const API_DOCS: ApiCategory[] = [
  {
    category: "Public Storefront",
    description: "Open endpoints for building game browsers and verification tools.",
    endpoints: [
      {
        method: "GET",
        path: "/games",
        title: "List All Games",
        description: "Fetch all active game titles with their metadata, optimized for landing pages.",
        response: `[
  {
    "id": "clxt2p...",
    "name": "Mobile Legends",
    "slug": "mobile-legends",
    "iconUrl": "/uploads/game-icons/ml.png",
    "bannerUrl": "/uploads/banners/ml-hero.jpg"
  }
]`
      },
      {
        method: "GET",
        path: "/games/:slug",
        title: "Get Game Detail",
        description: "Retrieve complete game info including all tiered top-up packages.",
        response: `{
  "id": "clxt2p...",
  "name": "Mobile Legends",
  "packages": [
    {
      "id": "pkg_unique01",
      "name": "86 Diamonds",
      "amount": 86,
      "price": 1.70,
      "discountPercent": 5
    }
  ]
}`
      },
      {
        method: "POST",
        path: "/games/:slug/verify",
        title: "Verify Account",
        description: "Validate a User ID / Zone ID before facilitating credit delivery.",
        params: `{
  "playerId": "12345678",
  "zoneId": "2001"
}`,
        response: `{
  "success": true,
  "playerName": "TheRatha007",
  "isVerified": true
}`
      }
    ]
  },
  {
    category: "Reseller API (v1)",
    description: "Direct supply endpoints for high-volume integration and automated top-ups.",
    auth: "Invitation Only: X-API-Key + X-API-Secret Required",
    endpoints: [
      {
        method: "GET",
        path: "/reseller/packages",
        title: "Sync Product Catalog",
        description: "Fetch the live list of available packages, including internal package IDs and real-time pricing.",
        headers: {
          "X-API-Key": "pk_live_...",
          "X-API-Secret": "sk_live_..."
        },
        response: `{
  "success": true,
  "data": [
    {
      "id": "pkg_86_ml_12",
      "name": "86 Diamonds",
      "game": "Mobile Legends",
      "price": 1.75,
      "requiresZone": true
    }
  ]
}`
      },
      {
        method: "POST",
        path: "/reseller/order",
        title: "Submit Instant Order",
        description: "Submit a top-up request. NOTE: Real-time Player ID verification is enforced. Orders for non-existent accounts will be automatically rejected (422).",
        headers: {
          "X-API-Key": "pk_live_...",
          "X-API-Secret": "sk_live_..."
        },
        params: `{
  "packageId": "pkg_86_ml_12",
  "playerInfo": {
    "playerId": "12345678",
    "zoneId": "2001"
  }
}`,
        response: `{
  "success": true,
  "message": "Order fulfillment initiated",
  "data": {
    "orderId": "tx_2026_03_10_01",
    "status": "COMPLETED",
    "reference": "TOPUP-ML-88120",
    "playerName": "TheRatha007"
  }
}`
      }
    ]
  },
  {
    category: "Transactions",
    description: "Handle the flow from payment generation to fulfillment status.",
    endpoints: [
      {
        method: "POST",
        path: "/transactions",
        title: "Initialize Checkout",
        description: "Create a new transaction and generate the official Bakong KHQR image data.",
        params: `{
  "packageId": "pkg_...",
  "playerInfo": { "playerId": "44211" },
  "paymentMethod": "BAKONG"
}`,
        response: `{
  "id": "tx_req1",
  "status": "PENDING_PAYMENT",
  "payment": {
    "method": "BAKONG_KHQR",
    "qrData": "000201...",
    "md5": "e123..."
  }
}`
      },
      {
        method: "GET",
        path: "/transactions/:id/status",
        title: "Poll Order Status",
        description: "Check if a transaction has been paid and successfully fulfilled.",
        response: `{
  "id": "tx_req1",
  "status": "COMPLETED",
  "isPaid": true,
  "isFulfilled": true,
  "deliveryId": "TOPUP-99120-X"
}`
      }
    ]
  }
];

const ResponseBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic syntax highlight simulation
  const highlightCode = (text: string) => {
    return text.split('\n').map((line, i) => {
      const isKey = line.includes('":');
      if (isKey) {
        const parts = line.split('":');
        return (
          <div key={i}>
            <span className="text-rose-400">{parts[0]}"</span>
            <span className="text-white">:</span>
            <span className="text-indigo-300">{parts[1]}</span>
          </div>
        );
      }
      return <div key={i}>{line}</div>;
    });
  };

  return (
    <div className="relative group rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#0a0f1e] shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.03]">
        <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Response Example</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-white group/btn"
        >
          {copied ? (
             <><Check className="w-3.5 h-3.5 text-green-500 animate-in zoom-in" /><span className="text-[10px] font-bold text-green-500">Copied</span></>
          ) : (
             <><Copy className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /><span className="text-[10px] font-bold">Copy</span></>
          )}
        </button>
      </div>
      <div className="p-6 font-mono text-xs overflow-x-auto leading-relaxed max-h-[400px] custom-scrollbar">
        {highlightCode(code)}
      </div>
    </div>
  );
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState("Public Storefront");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filteredDocs = API_DOCS.filter(cat => 
    cat.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.endpoints.some(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.path.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-400 selection:bg-indigo-500/30 font-sans">
      {/* Immersive Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/[0.07] blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-600/[0.05] blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-slate-950/40 border-r border-white-[0.03] backdrop-blur-3xl z-40 hidden lg:block overflow-y-auto overflow-x-hidden">
        <div className="p-10 space-y-12">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/20">
                    <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">CORE<span className="text-indigo-500">API</span></h1>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1 block">Documentation v1.4</span>
                </div>
            </div>

            <nav className="space-y-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-4 mb-4">Endpoints</p>
                {API_DOCS.map(cat => (
                    <button
                        key={cat.category}
                        onClick={() => setActiveTab(cat.category)}
                        className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === cat.category 
                            ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-600/5' 
                            : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border border-transparent'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {cat.category === "Public Storefront" && <Globe className="w-4 h-4" />}
                            {cat.category === "Reseller API (v1)" && <Workflow className="w-4 h-4 transition-transform group-hover:rotate-12" />}
                            {cat.category === "Transactions" && <Zap className="w-4 h-4 fill-amber-500/20 text-amber-500" />}
                            {cat.category}
                        </div>
                        {activeTab === cat.category && <ChevronRight className="w-3 h-3 text-indigo-500 animate-in slide-in-from-left-2" />}
                    </button>
                ))}
            </nav>

            <div className="pt-10 border-t border-white/[0.03] space-y-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 opacity-50">Guides & Security</p>
                <nav className="space-y-1 px-2">
                    <a href="#intro" className="group flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-white transition-all hover:bg-white/[0.02] rounded-xl">
                        <div className="w-5 flex justify-center">
                            <BookOpen className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        Getting Started
                    </a>
                    <a href="#auth" className="group flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-white transition-all hover:bg-white/[0.02] rounded-xl">
                        <div className="w-5 flex justify-center">
                            <ShieldLock className="w-4 h-4 group-hover:text-rose-400 transition-colors" />
                        </div>
                        Authentication
                    </a>
                    <a href="#ratelimits" className="group flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-white transition-all hover:bg-white/[0.02] rounded-xl">
                        <div className="w-5 flex justify-center">
                            <Zap className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                        </div>
                        Rate Limits
                    </a>
                </nav>
            </div>

            <div className="pt-10">
                <div className="relative group p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg w-fit">
                            <Workflow className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest italic leading-tight">Partner Access</h4>
                        <p className="text-slate-500 text-[10px] leading-relaxed font-bold">
                            Own a shop? Connect your system to our APIs with wholesale pricing. 
                        </p>
                        <a href="https://t.me/your_telegram" target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                            Apply Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-80 min-h-screen p-8 md:p-16 lg:p-24 relative z-10">
        <div className="max-w-5xl mx-auto space-y-24">
          
          {/* Header Dashboard */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 animate-in fade-in slide-in-from-top-8 duration-1000">
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 w-fit">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Master System Operational</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.9] drop-shadow-2xl">
                    API<br/><span className="gradient-text">EXPLORER</span>
                </h2>
                <div className="flex flex-wrap items-center gap-8 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl border border-white/5">
                            <Server className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Production Host</span>
                            <code className="text-xs text-white font-mono bg-white/[0.02] px-2 py-1 rounded-md">api.yourdomain.com/v1</code>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="relative group md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search master endpoints..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/40 border border-white/[0.05] rounded-[2rem] py-4 pl-14 pr-6 text-xs font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-700 backdrop-blur-xl"
                />
                <div className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                    <Command className="w-3 h-3 text-slate-600" />
                    <span className="text-[9px] font-black text-slate-600">K</span>
                </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* API Grid */}
          <div className="space-y-40">
            {API_DOCS.filter(cat => searchQuery ? filteredDocs.includes(cat) : cat.category === activeTab).map(cat => (
              <section key={cat.category} className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                
                {/* Category Header */}
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-[1.5rem] shadow-2xl ${
                      cat.category.includes('Public') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-indigo-500/5' : 
                      cat.category.includes('Reseller') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-rose-500/5' : 
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/5'
                    }`}>
                        {cat.category === "Public Storefront" && <Globe className="w-8 h-8 rotate-12" />}
                        {cat.category === "Reseller API (v1)" && <Workflow className="w-8 h-8" />}
                        {cat.category === "Transactions" && <Zap className="w-8 h-8 fill-amber-500/20" />}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{cat.category}</h3>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60">System Module</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mt-4">{cat.description}</p>
                  
                  {cat.auth && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-950/50 border border-rose-500/10 rounded-2xl w-fit group hover:border-rose-500/30 transition-all cursor-default">
                        <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{cat.auth}</span>
                    </div>
                  )}
                </div>

                {/* Endpoint Cards */}
                <div className="space-y-32">
                  {cat.endpoints.map(endpoint => (
                    <div key={endpoint.path} className="group/card relative">
                      {/* Glow Connector */}
                      <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block"></div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        
                        {/* 1. Method & Logic */}
                        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                                        endpoint.method === 'GET' 
                                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-indigo-600/5' 
                                        : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5'
                                    }`}>
                                        {endpoint.method}
                                    </div>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{endpoint.title}</h4>
                                </div>
                                
                                <div className="group/url relative">
                                    <code className="block w-full text-sm text-indigo-300 bg-[#0a0f1e] px-5 py-4 rounded-2xl border border-white/[0.05] font-mono shadow-inner group-hover/url:border-indigo-500/30 transition-all">
                                        <span className="text-slate-600 mr-2">BASE_URL</span>
                                        {endpoint.path}
                                    </code>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(endpoint.path)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg opacity-0 group-hover/url:opacity-100 transition-all text-slate-500"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {endpoint.description}
                            </p>

                            {/* Detailed Headers & Params */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {endpoint.headers && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Headers</span>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(endpoint.headers).map(([key]) => (
                                                <div key={key} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.03]">
                                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{key}</span>
                                                    <span className="text-[9px] text-slate-600 italic">string</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {endpoint.params && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-3.5 h-3.5 text-indigo-500/60" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Payload</span>
                                        </div>
                                        <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/5 shadow-inner">
                                            <pre className="text-indigo-400/70 font-mono text-[11px] leading-relaxed">
                                                {endpoint.params}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all group/btn">
                                <Code2 className="w-4 h-4 text-indigo-500 group-hover/btn:rotate-12 transition-transform" />
                                Interactive API Runner
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* 2. Response Dashboard */}
                        <div className="lg:col-span-12 xl:col-span-7 animate-in slide-in-from-right-12 duration-1000">
                             <ResponseBlock code={endpoint.response} />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer Branding */}
          <footer className="pt-32 pb-16 border-t border-white/[0.03] space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/5 rounded-[2rem] border border-white/5 shadow-2xl">
                        <Cpu className="w-10 h-10 text-indigo-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">TopUpPay Infrastructure</h4>
                        <p className="text-slate-600 text-[10px] uppercase tracking-[0.4em] font-black">
                            Scale &bull; Automate &bull; Dominate
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-10">
                    {['Telegram', 'Documentation', 'Status'].map(item => (
                        <a key={item} href="#" className="text-[10px] font-black text-slate-500 hover:text-indigo-500 transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-indigo-500/50 pb-1">
                            {item}
                        </a>
                    ))}
                </div>
            </div>
            
            <div className="text-center pt-12">
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-[1em] ml-4">
                    AUTHENTIC PROVIDER &bull; CAMBODIA CORE
                </p>
            </div>
          </footer>

        </div>
      </main>

      <style jsx global>{`
        .gradient-text {
            background: linear-gradient(135deg, #fff 0%, #818cf8 50%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .animate-pulse-slow {
            animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.2; transform: scale(1.1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>
  );
}

// Custom Icons
const ShieldLock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><rect width="8" height="5" x="8" y="11" rx="1"/><path d="M12 11V9a2 2 0 1 1 4 0v2"/></svg>
);
