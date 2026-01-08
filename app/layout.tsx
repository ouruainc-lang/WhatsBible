import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "DailyWord | Daily Bible Readings on WhatsApp",
  description: "Get the daily Bible readings, reflections, and prayers delivered directly to your WhatsApp every morning. Start your day with grace.",
  icons: {
    icon: "/dailywordlogo.png",
    shortcut: "/dailywordlogo.png",
    apple: "/dailywordlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
