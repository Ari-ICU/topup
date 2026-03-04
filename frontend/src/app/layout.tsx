import type { Metadata } from "next";
import { Inter, Rajdhani, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/context/lang-context";
import { AuthProvider } from "@/context/auth-context";

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
  variable: "--font-khmer",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DAI-GAME | បញ្ចូលហ្គេមភ្លាមៗ · Instant Game Credits",
  description:
    "បញ្ចូលហ្គេមភ្លាមៗ — Mobile Legends, Free Fire, PUBG និង ហ្គេម 50+ ទៀត។ ការទូទាត់តាម KHQR / ABA · Get instant game credits. Secure, lightning-fast delivery.",
  keywords: "game top up, mobile legends diamonds, free fire diamonds, pubg uc, instant game credits, ហ្គេម, បញ្ចូលហ្គេម",
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
            {children}
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
