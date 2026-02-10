import type { Metadata, Viewport } from "next";
import { Open_Sans, Oswald, Permanent_Marker } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "PITMSTR LIVE FIRE Leaderboard | NHSBBQA",
  description:
    "Real-time BBQ competition leaderboard for the National High School BBQ Association. Track teams, scores, and rankings across events nationwide.",
  keywords: [
    "BBQ",
    "barbecue",
    "high school",
    "competition",
    "leaderboard",
    "NHSBBQA",
    "PITMSTR",
  ],
  authors: [{ name: "NHSBBQA" }],
  openGraph: {
    title: "PITMSTR LIVE FIRE Leaderboard",
    description: "Real-time BBQ competition rankings - Where Dreams Ignite!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C62828",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${oswald.variable} ${permanentMarker.variable} antialiased`}
        style={{ fontFamily: "var(--font-open-sans), sans-serif" }}
      >
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
