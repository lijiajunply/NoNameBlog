import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200/80 py-10 dark:border-neutral-800/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-sm text-neutral-500 md:px-10 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.siteName}. All rights
          reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/rss.xml"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            RSS
          </Link>
          <Link
            href="/sitemap.xml"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            Sitemap
          </Link>
        </div>
      </div>
    </footer>
  );
}
