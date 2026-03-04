import QRCode from "react-qr-code";

interface KhqrModalProps {
    qrCode: string;
    amount: string;
    playerName?: string;
    onCancel: () => void;
}

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

export function KhqrModal({ qrCode, amount, playerName, onCancel }: KhqrModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-[340px] overflow-hidden p-0 shadow-2xl animate-scale-in bg-[#131520] border-none rounded-[20px]">

                {/* Header Pattern */}
                <div className="bg-[#e9323c] py-[18px] text-center">
                    <div className="flex justify-center items-center gap-2.5">
                        <OutlineBakongIcon className="w-5 h-5 text-white" />
                        <div className="text-white font-bold tracking-[0.15em] text-[15px]">KHQR</div>
                    </div>
                </div>

                <div className="p-8 pb-6 flex flex-col items-center">
                    <div className="mb-6 text-center">
                        <div className="text-slate-500 text-[10px] tracking-[0.1em] uppercase mb-2 font-bold italic">Recipient Identity</div>
                        {playerName ? (
                            <div className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-1">{playerName}</div>
                        ) : null}
                        <div className="font-display text-[32px] font-bold text-white tracking-tight leading-none">${amount}</div>
                    </div>

                    {/* QR Code */}
                    <div className="mb-5 flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-3.5 relative">
                        <QRCode value={qrCode} size={256} level="Q" className="w-full h-full" style={{ maxWidth: "100%", height: "auto" }} />

                        {/* Center Bakong Logo Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex bg-white rounded-full items-center justify-center p-1">
                                <div className="h-[38px] w-[38px] relative flex items-center justify-center rounded-full overflow-hidden">
                                    <BakongIcon className="w-full h-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="text-[11px] text-slate-500 mb-6 font-medium text-center w-full">
                        Scan with any banking app in Cambodia
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-center gap-2 rounded-[14px] bg-[#1a1c29] py-[14px] w-full">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e9323c]"></span>
                            </div>
                            <span className="text-[13px] text-slate-400 font-medium">Awaiting Payment...</span>
                        </div>

                        <button
                            onClick={onCancel}
                            className="w-full py-2 text-[13px] font-semibold text-slate-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
