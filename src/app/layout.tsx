import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  alternates: {
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
            <GoogleAnalytics />
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
