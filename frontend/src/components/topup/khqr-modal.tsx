import Link from "next/link";
import { useState } from "react";
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
    const [copied, setCopied] = useState(false);

    // ABA deeplink — encodes the KHQR string into the ABA Pay deeplink
    // Format: aba://pay?qr=<encoded_qr>
    // This opens ABA Pay app directly on mobile and pre-fills the QR
    const abaDeepLink = `aba://pay?qr=${encodeURIComponent(qrCode)}`;

    // Bakong universal deeplink (works with multiple banks via Bakong app)
    const bakongDeepLink = `bakong://pay?qr=${encodeURIComponent(qrCode)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(qrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback silently
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
            <div className="w-full max-w-[360px] overflow-hidden shadow-2xl animate-scale-in bg-[#131520] border border-white/10 rounded-[24px]">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-[#c0001a] to-[#e9323c] py-[16px] text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                    <div className="relative flex flex-col items-center gap-1">
                        <div className="flex justify-center items-center gap-2.5">
                            <OutlineBakongIcon className="w-5 h-5 text-white" />
                            <div className="text-white font-bold tracking-[0.15em] text-[15px]">KHQR</div>
                        </div>
                        <div className="text-white/70 text-[10px] font-medium tracking-widest uppercase">
                            Bakong · Any Bank in Cambodia
                        </div>
                    </div>
                </div>

                <div className="p-6 pb-5 flex flex-col items-center">
                    {/* Amount */}
                    <div className="mb-5 text-center">
                        {playerName && (
                            <div className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-1">
                                <span className="text-slate-500 text-[10px] tracking-[0.1em] uppercase mb-2 font-bold italic">Player: </span>
                                {playerName}
                            </div>
                        )}
                        <div className="font-display text-[36px] font-black text-white tracking-tight leading-none">
                            <span className="text-[20px] text-slate-400 mr-1">$</span>{amount}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1 tracking-widest uppercase">Scan to Pay</div>
                    </div>

                    {/* QR Code */}
                    <div className="mb-4 w-full aspect-square flex items-center justify-center rounded-2xl bg-white p-3 relative shadow-lg">
                        <QRCode
                            value={qrCode}
                            size={256}
                            level="Q"
                            className="w-full h-full"
                            style={{ maxWidth: "100%", height: "auto" }}
                        />
                        {/* Center Bakong Logo Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex bg-white rounded-full items-center justify-center p-1 shadow-md border border-slate-100">
                                <div className="h-[36px] w-[36px] relative flex items-center justify-center rounded-full overflow-hidden">
                                    <BakongIcon className="w-full h-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Compatibility Row */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-[10px] text-slate-600 font-medium">Works with</div>
                        <div className="flex items-center gap-1">
                            {BANK_DOTS.map((bank) => (
                                <div
                                    key={bank.label}
                                    title={bank.label}
                                    className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                                    style={{ backgroundColor: bank.color }}
                                />
                            ))}
                            <div className="text-[10px] text-slate-600 font-medium ml-1">+ more</div>
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-[#1a1c29] py-[13px] mb-4">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e9323c]"></span>
                        </div>
                        <span className="text-[13px] text-slate-400 font-medium">Awaiting Payment...</span>
                    </div>

                    {/* Deep Link Buttons */}
                    <div className="w-full grid grid-cols-2 gap-2 mb-4">
                        {/* Open in ABA */}
                        <Link
                            href={abaDeepLink}
                            className="flex items-center justify-center gap-2 rounded-[12px] bg-[#003087] py-[11px] px-3 text-white text-[11px] font-bold tracking-wide hover:bg-[#003087]/80 transition-colors active:scale-95"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                <rect width="24" height="24" rx="4" fill="white" fillOpacity="0.2" />
                                <text x="4" y="17" fontSize="12" fontWeight="bold" fill="white">ABA</text>
                            </svg>
                            Open ABA
                        </Link>
                    </div>

                    {/* Copy QR string */}
                    <button
                        onClick={handleCopy}
                        className="w-full py-2 text-[11px] font-semibold text-slate-600 hover:text-slate-400 transition-colors mb-1"
                    >
                        {copied ? "✓ Copied!" : "Copy QR Code String"}
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full py-2 text-[12px] font-semibold text-slate-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
