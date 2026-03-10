import Link from "next/link";
import QRCode from "react-qr-code";

interface KhqrModalProps {
    qrCode: string;
    amount: string;
    playerName?: string;
    onCancel: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const BakongIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="50" fill="#E4222E" />
        <g stroke="white" strokeWidth="4.5" fill="none">
            <path d="M 50,15 L 63.5,26.5 L 80,20 L 73.5,36.5 L 85,50 L 73.5,63.5 L 80,80 L 63.5,73.5 L 50,85 L 36.5,73.5 L 20,80 L 26.5,63.5 L 15,50 L 26.5,36.5 L 20,20 L 36.5,26.5 Z" strokeLinejoin="round" />
            <path d="M 58,40 L 45,40 A 10,10 0 0,0 45,60 L 58,60" strokeLinecap="round" />
        </g>
    </svg>
);

const OutlineBakongIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <g stroke="currentColor" strokeWidth="6" fill="none">
            <path d="M 50,15 L 63.5,26.5 L 80,20 L 73.5,36.5 L 85,50 L 73.5,63.5 L 80,80 L 63.5,73.5 L 50,85 L 36.5,73.5 L 20,80 L 26.5,63.5 L 15,50 L 26.5,36.5 L 20,20 L 36.5,26.5 Z" strokeLinejoin="round" />
            <path d="M 58,40 L 45,40 A 10,10 0 0,0 45,60 L 58,60" strokeLinecap="round" />
        </g>
    </svg>
);

// Cambodian bank color dots for visual indicator
const BANK_DOTS = [
    { color: "#003087", label: "ABA" },
    { color: "#E30613", label: "Acleda" },
    { color: "#00A651", label: "Wing" },
    { color: "#F7941D", label: "Prince" },
    { color: "#1E3A8A", label: "Canadia" },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function KhqrModal({ qrCode, amount, playerName, onCancel }: KhqrModalProps) {
    // ABA deeplink — encodes the KHQR string into the ABA Pay deeplink
    const abaDeepLink = `aba://pay?qr=${encodeURIComponent(qrCode)}`;



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md transition-all duration-300">
            <div className="w-full max-w-[380px] max-h-[96vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-in bg-[#0c0d15] border border-white/10 rounded-[28px] sm:rounded-[32px] relative overflow-hidden">
                
                {/* Subtle outer glow */}
                <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-radial-at-t from-[#c0001a]/10 to-transparent pointer-events-none opacity-50" />

                {/* ── Header (Sticky) ── */}
                <div className="bg-gradient-to-br from-[#c0001a] via-[#e9323c] to-[#9b0015] py-[18px] sm:py-[22px] text-center relative overflow-hidden shadow-lg shrink-0">
                    {/* Animated shimmer effect on header */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                    
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
                    <div className="relative flex flex-col items-center gap-1">
                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                            <div className="bg-white/10 p-1 rounded-lg backdrop-blur-sm border border-white/20">
                                <OutlineBakongIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="text-white font-black tracking-[0.2em] text-[16px] sm:text-[18px] drop-shadow-md">KHQR</div>
                        </div>
                        <div className="text-white/80 text-[9px] sm:text-[10px] font-bold tracking-[0.12em] sm:tracking-[0.15em] uppercase flex items-center gap-1.5 sm:gap-2">
                             <span className="w-1 sm:w-1.5 h-[1px] bg-white/40" />
                             Bakong · Any Bank in Cambodia
                             <span className="w-1 sm:w-1.5 h-[1px] bg-white/40" />
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-6 flex flex-col items-center relative z-10">
                        {/* Amount & Player Section */}
                        <div className="mb-5 sm:mb-6 text-center w-full">
                            {playerName && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 sm:mb-3 animate-fade-in">
                                    <span className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase italic tracking-wider">Player</span>
                                    <span className="text-indigo-400 font-bold text-[10px] sm:text-xs tracking-wide">{playerName}</span>
                                </div>
                            )}
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline font-display">
                                    <span className="text-[18px] sm:text-[22px] text-indigo-500 font-bold mr-1 opacity-80">$</span>
                                    <span className="text-[36px] sm:text-[44px] font-black text-white tracking-tight leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                        {amount}
                                    </span>
                                </div>
                                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-1.5 sm:mt-2 tracking-[0.15em] sm:tracking-[0.2em] uppercase bg-white/5 py-1 px-3 sm:px-4 rounded-full border border-white/5">
                                    Scan to Securely Pay
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="mb-5 w-full max-w-[280px] sm:max-w-none aspect-square flex items-center justify-center rounded-[24px] sm:rounded-[28px] bg-white p-4 sm:p-5 relative shadow-[0_15px_40px_rgba(0,0,0,0.3)] group transition-transform duration-500 hover:scale-[1.02]">
                            {/* QR Corner Accents */}
                            <div className="absolute top-4 left-4 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-red-500/30 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-red-500/30 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-red-500/30 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-red-500/30 rounded-br-lg" />

                            <QRCode
                                value={qrCode}
                                size={256}
                                level="Q"
                                className="w-full h-full"
                                style={{ maxWidth: "100%", height: "auto" }}
                            />
                            
                            {/* Center Bakong Logo Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex bg-white rounded-[14px] sm:rounded-2xl items-center justify-center p-1 sm:p-1.5 shadow-xl border border-slate-100 ring-2 sm:ring-4 ring-white">
                                    <div className="h-[32px] w-[32px] sm:h-[42px] sm:w-[42px] relative flex items-center justify-center rounded-lg sm:rounded-xl overflow-hidden bg-white">
                                        <BakongIcon className="w-full h-full" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Decorative scanning line effect */}
                            <div className="absolute inset-5 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-[10%] top-0 animate-[shimmer_2s_infinite] pointer-events-none rounded-full blur-sm" />
                        </div>

                        {/* Bank Compatibility Row */}
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6 w-full">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                {BANK_DOTS.map((bank) => (
                                    <div
                                        key={bank.label}
                                        title={bank.label}
                                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-125 cursor-help"
                                        style={{ backgroundColor: bank.color }}
                                    />
                                ))}
                            </div>
                            <div className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Works with all Cambodian Banks</div>
                        </div>

                        {/* Status indicator */}
                        <div className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 py-[12px] sm:py-[14px] mb-5 sm:mb-6 shadow-inner">
                            <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#e9323c] shadow-[0_0_10px_rgba(233,50,60,0.5)]"></span>
                            </div>
                            <span className="text-[12px] sm:text-[14px] text-slate-300 font-bold tracking-wide italic leading-none">Awaiting Payment...</span>
                        </div>

                        {/* Deep Link Buttons */}
                        <div className="w-full mb-4">
                            <Link
                                href={abaDeepLink}
                                className="flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-[#003087] py-[12px] sm:py-[14px] px-6 text-white text-[12px] sm:text-[14px] font-black tracking-wider hover:bg-[#003087]/90 transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(0,48,135,0.4)] active:scale-95 group shadow-lg"
                            >
                                <div className="bg-white/20 p-1 rounded-md shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-current">
                                        <text x="50%" y="65%" textAnchor="middle" fontSize="12" fontWeight="900" fill="white">A</text>
                                    </svg>
                                </div>
                                <span>OPEN IN ABA MOBILE</span>
                            </Link>
                        </div>

                        {/* Secondary Actions */}
                        <div className="w-full">
                            <button
                                onClick={onCancel}
                                className="w-full py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-bold text-slate-400 hover:text-white transition-colors border-t border-white/5 mt-1"
                            >
                                Cancel Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

