import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { GoogleAnalytics } from "@/components/common/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookMyFarmhouse — Premium Farmhouse & Event Venues",
    template: "%s | BookMyFarmhouse",
  },
  description:
    "Discover and book premium farmhouses, banquet halls, and outdoor event venues across India. Perfect for weddings, birthdays, corporate events, and more.",
  keywords: ["farmhouse booking", "event venue", "wedding venue", "farmhouse rental India"],
  openGraph: {
    title: "BookMyFarmhouse — Premium Event Venues",
    description: "Find and book the perfect farmhouse for your next event.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
