import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "./ui/button";
import { Icon } from "@iconify/react";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200/80 py-10 dark:border-neutral-800/80">
      <div className="mx-auto flex w-full container flex-col gap-3 px-6 text-sm text-neutral-500 lg:px-10 lg:flex-row items-center justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.siteName}. All rights
          reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="https://www.travellings.cn/go.html" target="_blank" rel="noopener" title="开往-友链接力" className="flex gap-0.5 justify-center items-center hover:text-neutral-900 dark:hover:text-white">
            <Icon icon="fa7-solid:train-subway" width="16" height="16" />
            <span className="text-sm">开往</span>
          </Link>
          <Link href="https://github.com/lijiajunply/NoNameBlog" target="_blank" rel="noopener" title="GitHub" className="flex gap-0.5 justify-center items-center hover:text-neutral-900 dark:hover:text-white">
            <Icon icon="lucide:github" width="16" height="16" />
            <span className="text-sm">GitHub Repo</span>
          </Link>
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
          <Link href="https://icp.gov.moe/?keyword=20260063" target="_blank" className="hover:text-neutral-900 dark:hover:text-white">
            萌ICP备20260063号
          </Link>
        </div>
      </div>
    </footer>
  );
}
