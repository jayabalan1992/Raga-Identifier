import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raga AI | Identify Indian Classical Ragas from Audio",
  description: "Upload an audio file, record your voice, or play MIDI to instantly identify the Indian classical raga and underlying swaras using AI.",
  keywords: "raga, indian classical music, carnatic, hindustani, ai raga identifier, swara detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-slate-950 text-slate-100 min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
