import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { TabPolish } from "@/components/ui/tab-polish";
import { SupportHub } from "@/components/ui/support-hub";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://daigamestopup.com"),
  title: "DAI-GAME | Instant Game Credits",
  description:
    "Get instant game credits — Mobile Legends, Free Fire, PUBG and 50+ more games. Pay via KHQR / ABA. Secure, lightning-fast delivery.",
  keywords: "game top up, mobile legends diamonds, free fire diamonds, pubg uc, instant game credits",
  icons: {
    icon: "/package-logo.png?v=2",
    shortcut: "/package-logo.png?v=2",
    apple: "/package-logo.png?v=2",
  },
  openGraph: {
    title: "DAI-GAME | Instant Game Credits",
    description: "Get instant game credits — Mobile Legends, Free Fire, PUBG and 50+ more games. Pay via KHQR / ABA.",
    url: "https://daigamestopup.com",
    siteName: "DAI-GAME",
    images: [
      {
        url: "/package-logo.png",
        width: 800,
        height: 600,
        alt: "DAI-GAME Top up center",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAI-GAME | Instant Game Credits",
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
    canonical: "https://daigamestopup.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${rajdhani.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <TabPolish />
          <SupportHub />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
