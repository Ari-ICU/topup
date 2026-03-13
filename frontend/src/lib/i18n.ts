// ============================================================================
// 🌐 i18n — English translations for public-facing pages
// ============================================================================

export type Lang = "en";

export const t = {
    // ── Navigation ──────────────────────────────────────────────────────────
    nav: {
        topUpNow: "Top Up Now",
        backToGames: "Back to Games",
    },

    // ── Stats ────────────────────────────────────────────────────────────────
    stats: {
        activeUsers: "Active Users",
        deliveryTime: "Delivery Time",
        deliveryTimeBadge: "< 5 Seconds",
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
        badge: "⚡ Instant Delivery • No Hidden Fees",
        line1: "INSTANT",
        line2: "GAME CREDITS",
        line3: "IN SECONDS",
        desc: "Empowering your gaming journey with lightning-fast credits. Trusted by 500K+ gamers for secure, instant top-ups with no hidden fees and 24/7 reliability.",
        browseGames: "Browse Games",
        howItWorks: "How It Works",
        instantDelivery: "Instant Delivery",
        sslEncrypted: "SSL Encrypted",
        support247: "24/7 Support",
        official: "Official",
        secured: "Secured",
        instant: "Instant",
    },

    // ── Games Section ────────────────────────────────────────────────────────
    gamesSection: {
        badge: "Popular Games",
        title1: "PICK YOUR",
        title2: "GAME",
        desc: "Direct access to over 50+ official game credits with transparent pricing and guaranteed automated delivery.",
        startingFrom: "Starting From",
        comingSoon: "Coming Soon",
        noGamesFound: "No Games Found",
        checkBackSoon: "Please check back soon. Games are being added!",
    },

    // ── How It Works ─────────────────────────────────────────────────────────
    howItWorks: {
        badge: "Simple Process",
        title1: "HOW IT",
        title2: "WORKS",
        steps: [
            { title: "Choose Your Game", desc: "Browse our extensive library of 50+ popular games and select yours." },
            { title: "Enter Player ID", desc: "Input your in-game Player ID and Zone ID to receive credits." },
            { title: "Select Package", desc: "Review options and select the amount of game credits you wish to purchase." },
            { title: "Pay & Receive Instantly", desc: "Choose your payment method, confirm, and get credits in under 5 seconds." },
        ],
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        desc: "Cambodia's #1 platform for instant game top-ups. Experience lightning-fast delivery and top-tier security for all your favorite mobile games.",
        platform: "Platform",
        gamesList: "Games List",
        howWorks: "How it Works",
        payments: "Supported Payments",
        copyright: "All rights reserved. Built with ⚡ for gamers.",
    },

    // ── Top-up Page ──────────────────────────────────────────────────────────
    topup: {
        liveLabel: "Service Active",
        instantLabel: "Instant Delivery",
        instantEnabled: "⚡ Instant Delivery Active 24/7",
        deliverySub: "⚡ Credits delivered instantly • 100% Verified & Secure",
        startingFrom: "Starting From",
        step1title: "ENTER PLAYER DETAILS",
        step1sub: "Your game account information",
        playerIdLabel: "Player ID",
        zoneIdLabel: "Zone ID",
        optional: "(optional)",
        verifyBtn: "Verify Account",
        verifyingBtn: "Securing Connection...",
        verifyHint: "Please verify your ID to ensure 100% accuracy",
        step2title: "SELECT PACKAGE",
        step2sub: "Choose the credits amount you need",
        step3title: "PAYMENT METHOD",
        step3sub: "Select your preferred payment option",
        orderSummary: "ORDER SUMMARY",
        game: "Game",
        playerId: "Player ID",
        package: "Package",
        payment: "Payment",
        totalAmount: "Total Amount",
        credits: "credits",
        confirmPay: "Confirm & Pay",
        processing: "Processing...",
        completeSteps: "Complete all steps above to continue",
        creating: "Creating Transaction...",
        awaiting: "Awaiting Payment...",
        success: "Transaction Successful!",
        newTx: "↩ Start New Transaction",
        sslEncrypted: "SSL Encrypted",
        secure100: "100% Secure",
        instant: "Instant",
        sec5: "< 5 sec",
        encrypted: "Encrypted",
        support: "Support",
        support247: "24/7",
        verifySuccess: "Account verified successfully ✓",
        verifyFormat: "Format Valid",
        verifyFormatHint: "Player ID format looks correct. Please confirm your ID in-game before paying.",
        verifyInvalid: "Invalid ID",
        language: "Language",
        viewSummary: "View Summary ↓",
        termsTitle: "SECURITY & TERMS",
        agreeToTerms: "I agree to the terms and privacy policy",
        buyNow: "PURCHASE NOW",
        insufficientStock: "Sorry, this package exceeds our current diamond stock.",
        noPackagesTitle: "Packages Unavailable",
        noPackagesDesc: "No top-up packages are currently available for this game. Check back soon!",
    },
    // ── Not Found Page ─────────────────────────────────────────────────────────────
    notFound: {
        badge: "404 Error",
        title: "PAGE NOT FOUND",
        desc: "The level you're looking for doesn't exist or has been moved to another quest.",
        backHome: "Back to Home",
    },
} as const;

// Helper — get translated string (now just returns the string directly as it's only English)
export function tr(key: any, _lang?: string): string {
    return typeof key === 'string' ? key : (key?.en || "");
}
