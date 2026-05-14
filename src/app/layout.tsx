import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iORGANBIO AI CRM",
  description: "AI-powered conference networking CRM for effortless contact management.",
  applicationName: "iORGANBIO",
  themeColor: "#4B2A4B", // Brand Plum
  appleWebApp: {
    title: "iORGANBIO",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
