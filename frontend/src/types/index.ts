// ===== SHARED TYPES =====

export interface GamePackage {
    id: string;
    name: string;
    amount: number;
    price: number;
    description?: string;
    badgeText?: string;
    isWeeklyPass: boolean;
}

export interface Game {
    id: string;
    name: string;
    slug: string;
    iconUrl: string;
    bannerUrl?: string;
    inputConfig: any;
    packages: GamePackage[];
    isActive?: boolean;
    _count?: {
        packages: number;
    };
    /** Total diamonds in stock. -1 = unlimited. 0 = sold out. */
    globalStockDiamonds?: number;
}

export interface PaymentMethod {
    id: string;
    name: string;
    shortName: string;
    icon: string;
    color: string;
    desc: string;
}

export type TransactionStatus = "IDLE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type VerifyStatus = "idle" | "success" | "format-ok" | "error";

export interface Promotion {
    id: string;
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeColor: string;
    imageUrl: string;
    linkUrl?: string;
    isActive?: boolean;
}
