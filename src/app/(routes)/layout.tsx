import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen dark:bg-[radial-gradient(circle_at_15%_10%,rgba(199,210,254,0.25),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(251,191,36,0.15),transparent_35%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
