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

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
        badge: { en: "⚡ Instant Delivery • No Hidden Fees", km: "⚡ ដឹកជញ្ជូនភ្លាមៗ • គ្មានថ្លៃលាក់" },
        line1: { en: "INSTANT", km: "បញ្ចូលទឹកប្រាក់" },
        line2: { en: "GAME CREDITS", km: "ហ្គេម" },
        line3: { en: "IN SECONDS", km: "ភ្លាមៗ" },
        desc: { en: "Power up your gameplay instantly. Trusted by 500K+ gamers worldwide for fast, secure top-ups with 100+ payment methods and zero hidden fees.", km: "បង្កើនសមត្ថភាពហ្គេមភ្លាមៗ។ អ្នកលេង 500K+ ទូទាំងពិភពលោកជឿទុកចិត្ត។" },
        browseGames: { en: "Browse Games", km: "រកហ្គេម" },
        howItWorks: { en: "How It Works", km: "របៀបប្រើ" },
        instantDelivery: { en: "Instant Delivery", km: "ដឹកភ្លាមៗ" },
        sslEncrypted: { en: "SSL Encrypted", km: "ការពារ SSL" },
        support247: { en: "24/7 Support", km: "ជំនួយ ២៤/៧" },
        official: { en: "Official", km: "ផ្លូវការ" },
        secured: { en: "Secured", km: "សុវត្ថិភាព" },
        instant: { en: "Instant", km: "ភ្លាមៗ" },
    },

    // ── Stats ────────────────────────────────────────────────────────────────
    stats: {
        happyPlayers: { en: "Happy Players", km: "អ្នកលេងសប្បាយ" },
        transactionsDone: { en: "Transactions Done", km: "ប្រតិបត្តិការ" },
        gamesAvailable: { en: "Games Available", km: "ហ្គេមទាំងអស់" },
        deliveryTime: { en: "Delivery Time", km: "ពេលដឹក" },
        activeUsers: { en: "Active Users", km: "អ្នកលេងសកម្ម" },
        deliveryTimeBadge: { en: "< 5 Seconds", km: "< ៥ វិនាទី" },
        platforms: {
            ios: { en: "iOS", km: "iOS" },
            android: { en: "Android", km: "Android" },
            pc: { en: "PC & Console", km: "PC & កុងសូល" },
        }
    },

    // ── Games Section ────────────────────────────────────────────────────────
    gamesSection: {
        badge: { en: "Popular Games", km: "ហ្គេមពេញនិយម" },
        title1: { en: "PICK YOUR", km: "ជ្រើសរើស" },
        title2: { en: "GAME", km: "ហ្គេមអ្នក" },
        desc: { en: "Browse 50+ popular games and get instant credits. Transparent pricing, instant delivery, guaranteed.", km: "រំដោះ ហ្គេម ៥០+ ហើយទទួលបានក្រេឌីតភ្លាមៗ។ តម្លៃច្បាស់លាស់ ដឹកជញ្ជូនភ្លាមៗ គ្រប់ពេល។" },
        startingFrom: { en: "Starting From", km: "ចាប់ផ្ដើមពី" },
        comingSoon: { en: "Coming Soon", km: "ឆាប់ៗនេះ" },
        noGamesFound: { en: "No Games Found", km: "រកមិនឃើញហ្គេមទេ" },
        checkBackSoon: { en: "Please check back soon. Games are being added!", km: "សូមពិនិត្យមើលឡើងវិញឆាប់ៗ។ ហ្គេមកំពុងត្រូវបានបន្ថែម!" },
    },

    // ... benefits ...
    benefits: {
        badge: { en: "Why Choose TopUpPay", km: "ហេតុអ្វីត្រូវជ្រើស TopUpPay" },
        title1: { en: "THE", km: "វេទិកា" },
        title2: { en: "ULTIMATE", km: "ល្អបំផុត" },
        title3: { en: "TOP-UP PLATFORM", km: "បញ្ចូលហ្គេម" },
        desc: { en: "Experience the fastest and most secure way to top up your game accounts, trusted by half a million players", km: "ជួបប្រទះវិធីលឿនបំផុត ស្ទុះបំផុតក្នុងការបញ្ចូលហ្គេម ដែលអ្នកលេងកន្លះលានជឿទុកចិត្ត" },
        cards: {
            fast: { title: { en: "Lightning Fast", km: "លឿនខ្លាំង" }, desc: { en: "Credits delivered within 5 seconds. Our automated system processes transactions instantly, 24/7.", km: "ក្រេឌីតដឹងក្នុង ៥ វិនាទី ប្រព័ន្ធស្វ័យប្រវត្តិប្រतិបត្តិ ២៤/៧។" }, badge: { en: "< 5 seconds", km: "< ៥ វិនាទី" } },
            secure: { title: { en: "Bank-Level Security", km: "សុវត្ថិភាព" }, desc: { en: "Military-grade SSL encryption protects every transaction. Your account data is always safe.", km: "ការអ៊ីនគ្រីប SSL កម្រិតយោធាការពាររាល់ប្រតិបត្តិការ។ ទិន្នន័យអ្នកតែងតែមានសុវត្ថិភាព។" }, badge: { en: "SSL Secured", km: "ការពារ SSL" } },
            support: { title: { en: "24/7 Live Support", km: "ជំនួយ ២៤/៧" }, desc: { en: "Our dedicated support team is available around the clock to help with any issues.", km: "ក្រុមជំនួយរបស់យើងអាចប្រើបានគ្រប់ពេល ដើម្បីជួយដោះស្រាយបញ្ហារបស់អ្នក។" }, badge: { en: "Always On", km: "តែងបើក" } },
            prices: { title: { en: "Best Market Prices", km: "តម្លៃល្អបំផុត" }, desc: { en: "Competitive rates with zero hidden fees. See the exact price before you confirm. No surprises.", km: "អត្រាប្រកួតប្រជែងដោយគ្មានថ្លៃលាក់។ ឃើញតម្លៃពិតមុនបញ្ជាក់។ គ្មានការភ្ញាក់ផ្អើល។" }, badge: { en: "No Hidden Fees", km: "គ្មានថ្លៃលាក់" } },
            always: { title: { en: "Always Available", km: "បើកគ្រប់ពេល" }, desc: { en: "TopUpPay never sleeps. Top up your game anytime, any day — including holidays and weekends.", km: "TopUpPay មិនដែរគេង។ បញ្ចូលហ្គេមគ្រប់ពេល រាល់ថ្ងៃ — រំលោះថ្ងៃចូលឆ្នាំ ថ្ងៃ休息ក៏ដោយ។" }, badge: { en: "365 Days/Year", km: "365 ថ្ងៃ/ឆ្នាំ" } },
        },
    },

    // ── How It Works ─────────────────────────────────────────────────────────
    howItWorks: {
        badge: { en: "Simple Process", km: "ដំណើរការងាយ" },
        title1: { en: "HOW IT", km: "របៀប" },
        title2: { en: "WORKS", km: "ប្រើប្រាស់" },
        steps: [
            { title: { en: "Choose Your Game", km: "ជ្រើសហ្គេម" }, desc: { en: "Browse our extensive library of 50+ popular games and select yours.", km: "រំដោះបណ្ណាលយហ្គេម ៥០+ ជ្រើសរើសហ្គេមដែលអ្នកចូលចិត្ត។" } },
            { title: { en: "Enter Player ID", km: "បញ្ចូល Player ID" }, desc: { en: "Input your in-game Player ID and Zone ID to receive credits.", km: "បញ្ចូល Player ID និង Zone ID ដើម្បីទទួលក្រេឌីត។" } },
            { title: { en: "Select Package", km: "ជ្រើសកញ្ចប់" }, desc: { en: "Review options and select the amount of game credits you wish to purchase.", km: "ពិនិត្យជម្រើស ហើយជ្រើសចំនួនក្រេឌីតដែលចង់ទិញ។" } },
            { title: { en: "Pay & Receive Instantly", km: "បង់ & ទទួលភ្លាម" }, desc: { en: "Choose your payment method, confirm, and get credits in under 5 seconds.", km: "ជ្រើសវិធីបង់ប្រាក់ បញ្ជាក់ ហើយទទួលក្រេឌីតក្នុង ៥ វិនាទី។" } },
        ],
    },

    // ── Reviews ──────────────────────────────────────────────────────────────
    reviews: {
        badge: { en: "Player Reviews", km: "មតិអ្នកលេង" },
        title1: { en: "WHAT", km: "អ្វីដែល" },
        title2: { en: "GAMERS", km: "អ្នកលេងហ្គេម" },
        title3: { en: "ARE SAYING", km: "និយាយ" },
        desc: { en: "Don't just take our word for it. Join thousands of satisfied players who trust us.", km: "មិនត្រូវជឿតែពាក្យរបស់យើងប៉ុណ្ណោះ។ ចូលរួមជាមួយអ្នកលេងរាប់ពាន់ដែលជឿទុកចិត្ត។" },
    },

    // ── CTA ──────────────────────────────────────────────────────────────────
    cta: {
        badge: { en: "Ready to Power Up?", km: "ត្រៀមខ្លួនហើយ?" },
        title1: { en: "START TOPPING UP", km: "ចាប់ផ្តើមបញ្ចូល" },
        title2: { en: "IN 30 SECONDS", km: "ក្នុង ៣០ វិនាទី" },
        desc: { en: "Join 500,000+ players who choose TopUpPay for lightning-fast delivery and absolute security.", km: "ចូលរួមជាមួយអ្នកលេង ៥០០,០០០+ ដែលជ្រើស TopUpPay ដើម្បីទទួលក្រេឌីតលឿននិងសុវត្ថិភាព។" },
        browseAll: { en: "Browse All Games", km: "រំដោះហ្គេម" },
        learnMore: { en: "Learn More", km: "ស្វែងយល់" },
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        desc: { en: "Direct gaming top-ups across 100+ countries. Lightning-fast delivery, secure payments, 24/7 support.", km: "បញ្ចូលហ្គេមលើ ១០០+ ប្រទេស។ ដឹកលឿន ការទូទាត់សុវត្ថិភាព ជំនួយ ២៤/៧។" },
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
        deliverySub: { en: "⚡ Credits delivered within 5 seconds • 100% Secure", km: "⚡ ក្រេឌីតដឹងក្នុង ៥ វិនាទី • ១០០% សុវត្ថិភាព" },
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
