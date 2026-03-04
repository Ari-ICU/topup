import { Game } from "@/types";

export const FALLBACK_GAMES: Game[] = [
    {
        id: "fallback-mlbb",
        name: "Mobile Legends",
        slug: "mobile-legends",
        iconUrl: "/mobile-legends.png",
        inputConfig: { zoneId: true },
        packages: [
            { id: "mlbb-86", name: "86 Diamonds", amount: 86, price: 1.55, points: 10, isWeeklyPass: false },
            { id: "mlbb-172", name: "172 Diamonds", amount: 172, price: 3.10, points: 20, isWeeklyPass: false },
            { id: "mlbb-257", name: "257 Diamonds", amount: 257, price: 4.65, points: 30, isWeeklyPass: false },
            { id: "mlbb-weekly", name: "Weekly Diamond Pass", amount: 1, price: 1.99, points: 15, isWeeklyPass: true },
        ]
    },
    {
        id: "fallback-ff",
        name: "Free Fire",
        slug: "free-fire",
        iconUrl: "/free-fire.png",
        inputConfig: { zoneId: false },
        packages: [
            { id: "ff-100", name: "100 Diamonds", amount: 100, price: 0.99, points: 5, isWeeklyPass: false },
            { id: "ff-310", name: "310 Diamonds", amount: 310, price: 2.99, points: 20, isWeeklyPass: false },
            { id: "ff-520", name: "520 Diamonds", amount: 520, price: 4.99, points: 35, isWeeklyPass: false },
        ]
    },
    {
        id: "fallback-pubg",
        name: "PUBG Mobile",
        slug: "pubg-mobile",
        iconUrl: "/hero-image.png",
        inputConfig: { zoneId: false },
        packages: [
            { id: "pubg-60", name: "60 UC", amount: 60, price: 0.99, points: 5, isWeeklyPass: false },
            { id: "pubg-325", name: "325 UC", amount: 325, price: 4.99, points: 30, isWeeklyPass: false },
        ]
    }
];
