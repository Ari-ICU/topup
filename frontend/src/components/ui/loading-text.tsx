"use client";

export function LoadingText({ text }: { text?: string }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="loading-text-glow text-xl md:text-3xl lg:text-4xl px-4 text-center">
                {text || 'PROCESSING...'}
            </div>
            <div className="flex gap-2 loading-dots">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="w-2 h-2 rounded-full bg-purple-300" />
            </div>
        </div>
    );
}
