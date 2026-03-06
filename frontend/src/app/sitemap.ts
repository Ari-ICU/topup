import { MetadataRoute } from 'next';
import { apiRequest } from '@/lib/api';
import { Game } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://topup-sable.vercel.app';

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ];

    try {
        const games = await apiRequest<Game[]>('/games');

        const gameRoutes: MetadataRoute.Sitemap = games
            .filter(game => game.isActive || (game as any).isActive !== false) // Ensure game is active
            .map((game) => ({
                url: `${baseUrl}/topup/${game.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));

        return [...staticRoutes, ...gameRoutes];
    } catch (error) {
        console.error('[Sitemap] Failed to fetch games for sitemap:', error);
        return staticRoutes;
    }
}
