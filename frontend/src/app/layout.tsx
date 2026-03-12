import type { Metadata } from "next";
import { Inter, Rajdhani, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/context/lang-context";
import { AuthProvider } from "@/context/auth-context";
import { TabPolish } from "@/components/ui/tab-polish";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const notoSansKhmer = Noto_Sans_Khmer({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["khmer"],
  variable: "--font-khmer-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DAI-GAME | បញ្ចូលហ្គេមភ្លាមៗ · Instant Game Credits",
  description:
    "បញ្ចូលហ្គេមភ្លាមៗ — Mobile Legends, Free Fire, PUBG និង ហ្គេម 50+ ទៀត។ ការទូទាត់តាម KHQR / ABA · Get instant game credits. Secure, lightning-fast delivery.",
  keywords: "game top up, mobile legends diamonds, free fire diamonds, pubg uc, instant game credits, ហ្គេម, បញ្ចូលហ្គេម",
  icons: {
    icon: "/package-logo.png?v=2",
    shortcut: "/package-logo.png?v=2",
    apple: "/package-logo.png?v=2",
  },
  openGraph: {
    title: "DAI-GAME | បញ្ចូលហ្គេមភ្លាមៗ · Instant Game Credits",
    description: "បញ្ចូលហ្គេមភ្លាមៗ — Mobile Legends, Free Fire, PUBG និង ហ្គេម 50+ ទៀត។ ការទូទាត់តាម KHQR / ABA",
    url: "https://topup-sable.vercel.app",
    siteName: "DAI-GAME",
    images: [
      {
        url: "/package-logo.png",
        width: 800,
        height: 600,
        alt: "DAI-GAME Top up center",
      },
    ],
    locale: "km_KH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAI-GAME | បញ្ចូលហ្គេមភ្លាមៗ",
    description: "Get instant game credits. Secure, lightning-fast delivery. KHQR supported.",
    images: ["/package-logo.png"],
  },
  verification: {
    google: "eddaf04c24dec5aa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://topup-sable.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body className={`${inter.variable} ${rajdhani.variable} ${notoSansKhmer.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <LangProvider>
            <TabPolish />
            {children}
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
