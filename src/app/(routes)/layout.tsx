import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/config/site";
import "katex/dist/katex.min.css";
import "@/app/globals.css";

const isVercelAnalyticsEnabled =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.siteName,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    title: siteConfig.siteName,
    description: siteConfig.description,
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description: siteConfig.description,
    images: ["/og-default.svg"],
  },
  alternates: {
    canonical: siteConfig.siteUrl,
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: `${siteConfig.siteName} RSS` },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen dark:bg-[radial-gradient(circle_at_15%_10%,rgba(199,210,254,0.25),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(251,191,36,0.15),transparent_35%)]">
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        {isVercelAnalyticsEnabled ? <Analytics /> : null}
      </body>
    </html>
  );
}
