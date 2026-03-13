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
                url: `https://daigamestopup.com/topup/${gameId}`,
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
                canonical: `https://daigamestopup.com/topup/${gameId}`,
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

export default async function GameLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ gameId: string }>;
}) {
    const { gameId } = await params;
    let jsonLd = null;

    try {
        const game = await apiRequest<Game>(`/games/${gameId}`);

        // Construct JSON-LD
        const packages = game.packages || [];
        const prices = packages.map(p => Number(p.price)).filter(p => !isNaN(p));
        
        if (packages.length > 0 && prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            jsonLd = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": `Top up ${game.name} Diamonds`,
                "description": `Fast and secure ${game.name} top-up. Instant delivery with KHQR support.`,
                "image": game.iconUrl,
                "brand": {
                    "@type": "Brand",
                    "name": game.name
                },
                "offers": {
                    "@type": "AggregateOffer",
                    "lowPrice": minPrice.toFixed(2),
                    "highPrice": maxPrice.toFixed(2),
                    "priceCurrency": "USD",
                    "offerCount": packages.length,
                    "availability": "https://schema.org/InStock",
                    "url": `https://daigamestopup.com/topup/${gameId}`
                }
            };
        }
    } catch (e) {
        console.warn("[JSON-LD] Failed to generate for game:", gameId);
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
