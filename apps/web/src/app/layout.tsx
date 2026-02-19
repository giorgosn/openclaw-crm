import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { GA4Script } from "@/components/analytics/ga4-script";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "OpenClaw CRM",
    template: "%s | OpenClaw CRM",
  },
  description:
    "The CRM your AI agent already knows how to use. Open-source, self-hosted, with native OpenClaw Bot integration.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io"
  ),
  openGraph: {
    title: "OpenClaw CRM",
    description:
      "The CRM your AI agent already knows how to use. Open-source, self-hosted, with native OpenClaw Bot integration.",
    siteName: "OpenClaw CRM",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw CRM",
    description:
      "The CRM your AI agent already knows how to use. Open-source, self-hosted, with native OpenClaw Bot integration.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PlausibleScript />
        <GA4Script />
        <ThemeProvider>{children}</ThemeProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
