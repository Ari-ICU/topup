// ============================================================================
// 🌐 i18n — English / Khmer translations for public-facing pages
// ============================================================================

export type Lang = "en" | "km";

export const t = {
    // ── Navigation ──────────────────────────────────────────────────────────
    nav: {
        games: { en: "Games", km: "ហ្គេម" },
        whyUs: { en: "Why Us", km: "ហេតុអ្វីយើង" },
        reviews: { en: "Reviews", km: "មតិអ្នកលេង" },
        signIn: { en: "Sign In", km: "ចូលគណនី" },
        topUpNow: { en: "Top Up Now", km: "បញ្ចូលឥឡូវ" },
        backToGames: { en: "Back to Games", km: "ត្រលប់" },
    },

    // ── Stats ────────────────────────────────────────────────────────────────
    stats: {
        activeUsers: { en: "Active Users", km: "អ្នកប្រើប្រាស់សកម្ម" },
        deliveryTime: { en: "Delivery Time", km: "រយៈពេលផ្ញើជូន" },
        deliveryTimeBadge: { en: "< 5 Seconds", km: "< ៥ វិនាទី" },
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
        badge: { en: "⚡ Instant Delivery • No Hidden Fees", km: "⚡ ផ្ញើជូនភ្លាមៗ • គ្មានថ្លៃសេវាលាក់កំបាំង" },
        line1: { en: "INSTANT", km: "បញ្ចូលទឹកប្រាក់" },
        line2: { en: "GAME CREDITS", km: "ហ្គេម" },
        line3: { en: "IN SECONDS", km: "ភ្លាមៗ" },
        desc: {
            en: "Elevate your gaming experience instantly. Trusted by 500K+ gamers for fast, secure top-ups with 100+ payment methods and zero hidden fees.",
            km: "បង្កើនបទពិសោធន៍ហ្គេមរបស់អ្នកភ្លាមៗ។ ទទួលបានការជឿទុកចិត្តពីអ្នកលេងជាង ៥០០,០០០ នាក់ សម្រាប់ការបញ្ចូលទឹកប្រាក់រហ័ស សុវត្ថិភាព ជាមួយជម្រើសបង់ប្រាក់ជាង ១០០ មុខ និងគ្មានថ្លៃសេវាលាក់កំបាំង។"
        },
        browseGames: { en: "Browse Games", km: "ស្វែងរកហ្គេម" },
        howItWorks: { en: "How It Works", km: "របៀបប្រើ" },
        instantDelivery: { en: "Instant Delivery", km: "ដឹកភ្លាមៗ" },
        sslEncrypted: { en: "SSL Encrypted", km: "ការពារ SSL" },
        support247: { en: "24/7 Support", km: "ជំនួយ ២៤/៧" },
        official: { en: "Official", km: "ផ្លូវការ" },
        secured: { en: "Secured", km: "សុវត្ថិភាព" },
        instant: { en: "Instant", km: "ភ្លាមៗ" },
    },

    // ── Games Section ────────────────────────────────────────────────────────
    gamesSection: {
        badge: { en: "Popular Games", km: "ហ្គេមពេញនិយម" },
        title1: { en: "PICK YOUR", km: "ជ្រើសរើស" },
        title2: { en: "GAME", km: "ហ្គេមអ្នក" },
        desc: {
            en: "Explore over 50 popular games and get instant credits with transparent pricing and guaranteed delivery.",
            km: "ស្វែងរកហ្គេមល្បីៗជាង ៥០ ប្រភេទ និងទទួលបានក្រេឌីតភ្លាមៗ ជាមួយតម្លៃច្បាស់លាស់ និងការផ្ញើជូនដែលជឿទុកចិត្តបាន។"
        },
        startingFrom: { en: "Starting From", km: "ចាប់ផ្ដើមពី" },
        comingSoon: { en: "Coming Soon", km: "ឆាប់ៗនេះ" },
        noGamesFound: { en: "No Games Found", km: "រកមិនឃើញហ្គេមទេ" },
        checkBackSoon: { en: "Please check back soon. Games are being added!", km: "សូមពិនិត្យមើលឡើងវិញឆាប់ៗ។ ហ្គេមកំពុងត្រូវបានបន្ថែម!" },
    },

    // ── How It Works ─────────────────────────────────────────────────────────
    howItWorks: {
        badge: { en: "Simple Process", km: "ដំណើរការងាយ" },
        title1: { en: "HOW IT", km: "របៀប" },
        title2: { en: "WORKS", km: "ប្រើប្រាស់" },
        steps: [
            { title: { en: "Choose Your Game", km: "ជ្រើសហ្គេម" }, desc: { en: "Browse our extensive library of 50+ popular games and select yours.", km: "ស្វែងរកហ្គេមដែលមានក្នុងបញ្ជីជាង ៥០ ប្រភេទ និងជ្រើសរើសហ្គេមដែលអ្នកចង់បាន។" } },
            { title: { en: "Enter Player ID", km: "បញ្ចូល Player ID" }, desc: { en: "Input your in-game Player ID and Zone ID to receive credits.", km: "បញ្ចូល Player ID និង Zone ID របស់អ្នកដើម្បីត្រៀមទទួលក្រេឌីត។" } },
            { title: { en: "Select Package", km: "ជ្រើសកញ្ចប់" }, desc: { en: "Review options and select the amount of game credits you wish to purchase.", km: "ពិនិត្យមើលជម្រើសរូបិយប័ណ្ណហ្គេម និងជ្រើសរើសកញ្ចប់ដែលអ្នកចង់ទិញ។" } },
            { title: { en: "Pay & Receive Instantly", km: "បង់ & ទទួលភ្លាម" }, desc: { en: "Choose your payment method, confirm, and get credits in under 5 seconds.", km: "ជ្រើសរើសវិធីសាស្ត្រទូទាត់ដែលអ្នកចូលចិត្ត បញ្ជាក់ ហើយទទួលក្រេឌីតក្នុងរយៈពេលក្រោម ៥ វិនាទី។" } },
        ],
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        desc: {
            en: "Cambodia's #1 platform for instant game top-ups. Experience lightning-fast delivery and top-tier security for all your favorite mobile games.",
            km: "វេទិកាបញ្ចូលទឹកប្រាក់ហ្គេមលេខ ១ នៅកម្ពុជា។ ជួបប្រទះការផ្ញើជូនដែលលឿនបំផុត និងមានសុវត្ថិភាពខ្ពស់បំផុត សម្រាប់ហ្គេមដែលអ្នកចូលចិត្ត។"
        },
        platform: { en: "Platform", km: "វេទិកា" },
        gamesList: { en: "Games List", km: "បញ្ជីហ្គេម" },
        howWorks: { en: "How it Works", km: "របៀបប្រើ" },
        payments: { en: "Supported Payments", km: "ការទូទាត់" },
        copyright: { en: "All rights reserved. Built with ⚡ for gamers.", km: "រក្សាសិទ្ធ។ បង្កើតដោយ ⚡ សម្រាប់អ្នកលេង។" },
    },

    // ── Top-up Page ──────────────────────────────────────────────────────────
    topup: {
        liveLabel: { en: "Live", km: "បើក" },
        instantLabel: { en: "Instant Delivery", km: "ដឹកភ្លាមៗ" },
        instantEnabled: { en: "Instant Delivery Enabled", km: "ដឹកជញ្ជូនភ្លាមៗ កំពុងបើក" },
        deliverySub: { en: "⚡ Credits delivered within 5 seconds • 100% Secure", km: "⚡ ទទួលបានក្រេឌីតក្នុងរយៈពេលក្រោម ៥ វិនាទី • ១០០% សុវត្ថិភាព" },
        startingFrom: { en: "Starting From", km: "ចាប់ពី" },
        step1title: { en: "ENTER PLAYER DETAILS", km: "បញ្ចូលព័ត៌មានអ្នកលេង" },
        step1sub: { en: "Your game account information", km: "ព័ត៌មានគណនីហ្គេមរបស់អ្នក" },
        playerIdLabel: { en: "Player ID", km: "Player ID" },
        zoneIdLabel: { en: "Zone ID", km: "Zone ID" },
        optional: { en: "(optional)", km: "(ស្រេចចិត្ត)" },
        verifyBtn: { en: "Verify Account", km: "ផ្ទៀងផ្ទាត់គណនី" },
        verifyingBtn: { en: "Checking...", km: "កំពុងពិនិត្យ..." },
        verifyHint: { en: "Validate your Player ID before purchasing", km: "ផ្ទៀងផ្ទាត់ Player ID មុនទិញ" },
        step2title: { en: "SELECT PACKAGE", km: "ជ្រើសកញ្ចប់" },
        step2sub: { en: "Choose the credits amount you need", km: "ជ្រើសចំនួនក្រេឌីតដែលអ្នកត្រូវការ" },
        step3title: { en: "PAYMENT METHOD", km: "វិធីទូទាត់" },
        step3sub: { en: "Select your preferred payment option", km: "ជ្រើសវិធីទូទាត់ដែលចូលចិត្ត" },
        orderSummary: { en: "ORDER SUMMARY", km: "សង្ខេបការបញ្ជាទិញ" },
        game: { en: "Game", km: "ហ្គេម" },
        playerId: { en: "Player ID", km: "Player ID" },
        package: { en: "Package", km: "កញ្ចប់" },
        payment: { en: "Payment", km: "ការទូទាត់" },
        totalAmount: { en: "Total Amount", km: "ចំនួនសរុប" },
        credits: { en: "credits", km: "ក្រេឌីត" },
        confirmPay: { en: "Confirm & Pay", km: "បញ្ជាក់ & បង់ប្រាក់" },
        processing: { en: "Processing...", km: "កំពុងដំណើរការ..." },
        completeSteps: { en: "Complete all steps above to continue", km: "បំពេញជំហានទាំងអស់ខាងលើដើម្បីបន្ត" },
        creating: { en: "Creating Transaction...", km: "កំពុងបង្កើតប្រតិបត្តិការ..." },
        awaiting: { en: "Awaiting Payment...", km: "រង់ចាំការទូទាត់..." },
        success: { en: "Transaction Successful!", km: "ប្រតិបត្តិការបានជោគជ័យ!" },
        newTx: { en: "↩ Start New Transaction", km: "↩ ចាប់ផ្តើមប្រតិបត្តិការថ្មី" },
        sslEncrypted: { en: "SSL Encrypted", km: "ការពារ SSL" },
        secure100: { en: "100% Secure", km: "១០០% សុវត្ថិភាព" },
        instant: { en: "Instant", km: "ភ្លាមៗ" },
        sec5: { en: "< 5 sec", km: "< ៥ វិនាទី" },
        encrypted: { en: "Encrypted", km: "អ៊ីនគ្រីប" },
        support: { en: "Support", km: "ជំនួយ" },
        support247: { en: "24/7", km: "២៤/៧" },
        verifySuccess: { en: "Account verified successfully ✓", km: "ផ្ទៀងផ្ទាត់គណនីបានជោគជ័យ ✓" },
        verifyFormat: { en: "Format Valid", km: "ទម្រង់ត្រឹមត្រូវ" },
        verifyFormatHint: { en: "Player ID format looks correct. Please confirm your ID in-game before paying.", km: "ទម្រង់ Player ID ត្រឹមត្រូវ។ សូមបញ្ជាក់ ID ក្នុងហ្គេមមុនបង់ប្រាក់។" },
        verifyInvalid: { en: "Invalid ID", km: "ID មិនត្រឹមត្រូវ" },
        language: { en: "Language", km: "ភាសា" },
        viewSummary: { en: "View Summary ↓", km: "មើលការសង្ខេប ↓" },
        termsTitle: { en: "TERMS & CONDITION", km: "លក្ខខណ្ឌ" },
        agreeToTerms: { en: "I agree to the terms", km: "ខ្ញុំយល់ព្រមតាម លក្ខខណ្ឌ" },
        buyNow: { en: "BUY NOW", km: "ទិញឥឡូវ" },
    },
    // ── Not Found Page ─────────────────────────────────────────────────────────────
    notFound: {
        badge: { en: "404 Error", km: "កំហុស 404" },
        title: { en: "PAGE NOT FOUND", km: "រកមិនឃើញទំព័រ" },
        desc: { en: "The level you're looking for doesn't exist or has been moved to another quest.", km: "ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមាន ឬត្រូវបានផ្លាស់ប្តូរទៅកាន់ទីតាំងផ្សេង។" },
        backHome: { en: "Back to Home", km: "ត្រលប់ទៅទំព័រដើម" },
    },
} as const;

// Helper — get translated string for current language
export function tr(key: { en: string; km: string }, lang: Lang): string {
    return key[lang];
}
