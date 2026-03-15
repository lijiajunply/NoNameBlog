import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { GlobalRouteLoader } from "@/components/global-route-loader";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/config/site";
import "katex/dist/katex.min.css";
import "./globals.css";

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
        <GlobalRouteLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {isVercelAnalyticsEnabled ? <Analytics /> : null}
      </body>
    </html>
  );
}
