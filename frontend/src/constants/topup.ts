import { PaymentMethod } from "@/types";

// ===== PAYMENT METHODS =====
// Add new payment methods here. They will automatically appear in the UI.
export const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: "bakong",
        name: "Bakong KHQR",
        shortName: "KHQR",
        icon: "🌐",
        color: "from-purple-600 to-indigo-700",
        desc: "National QR Code Payment",
    },
];

// ===== TRUST BADGES =====
export const TRUST_BADGES = [
    { label: "Instant", sub: "< 5 sec" },
    { label: "Secure", sub: "Encrypted" },
    { label: "Support", sub: "24/7" },
] as const;
