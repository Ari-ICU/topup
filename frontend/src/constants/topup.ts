import { PaymentMethod } from "@/types";

// ===== PAYMENT METHODS =====
// Add new payment methods here. They will automatically appear in the UI.
export const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: "bakong",
        name: "KHQR",
        shortName: "KHQR",
        icon: "/khqr-v2.png",
        color: "from-red-600 to-rose-500",
        desc: "ABA · Acleda · Wing · any bank in Cambodia",
    },
];

// ===== TRUST BADGES =====
export const TRUST_BADGES = [
    { label: "Instant", sub: "< 5 sec" },
    { label: "Secure", sub: "Encrypted" },
    { label: "Support", sub: "24/7" },
] as const;
