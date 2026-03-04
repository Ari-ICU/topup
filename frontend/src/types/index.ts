// ===== SHARED TYPES =====

export interface GamePackage {
    id: string;
    name: string;
    amount: number;
    price: number;
    points: number;
    description?: string;
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
