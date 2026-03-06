import { Metadata } from 'next';
import { apiRequest } from '@/lib/api';
import { Game } from '@/types';

type Props = {
    params: Promise<{ gameId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { gameId } = await params;

    try {
        const game = await apiRequest<Game>(`/games/${gameId}`);

        const title = `Top up ${game.name} Diamonds | DAI-GAME`;
        const description = `Get instant ${game.name} credits at DAI-GAME. Secure, lightning-fast delivery with KHQR support. Trusted by 500K+ gamers.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [game.iconUrl],
                url: `https://topup-sable.vercel.app/topup/${gameId}`,
                siteName: "DAI-GAME",
                locale: "km_KH",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [game.iconUrl],
            },
            alternates: {
                canonical: `https://topup-sable.vercel.app/topup/${gameId}`,
            },
        };
    } catch (error) {
        // Fallback for metadata if API fails or game not found
        const name = gameId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return {
            title: `Top up ${name} | DAI-GAME`,
            description: `Get instant game credits at DAI-GAME. Secure, fast delivery.`,
        };
    }
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
