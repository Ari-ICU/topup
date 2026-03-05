import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://daigame.net'; // Replace with your actual domain

    return [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // We can add more URLs here, like top-up pages for individual games
        // E.g. ${baseUrl}/topup/mobile-legends
    ];
}
