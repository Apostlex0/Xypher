import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ZEC Dark Perps | Privacy-First Perpetual Trading",
  description: "First privacy-preserving perpetual exchange bridging Zcash shielded pools to Solana with sub-100ms execution.",
  keywords: ["Zcash", "Solana", "DeFi", "Privacy", "Perpetuals", "Dark Pool"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}