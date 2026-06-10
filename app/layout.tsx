import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prestigeitsolutions.tech"),
  title: "Prestige POS | Point of Sale for Philippine cafés & retail",
  description:
    "A fast, modern iPad point-of-sale for cafés, restaurants, and shops. Sell, track inventory, manage shifts and payroll, and print receipts, all in one app.",
  openGraph: {
    title: "Prestige POS",
    description:
      "A fast, modern iPad point-of-sale for cafés, restaurants, and shops.",
    type: "website",
    url: "https://prestigeitsolutions.tech",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols — same icon set the Flutter app uses (Icons.*) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
