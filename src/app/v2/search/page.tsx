import type { Metadata } from "next";
import { SearchBox } from "@/components/search-box";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "搜索",
  description: "按关键字检索博客文章标题与正文。",
  alternates: {
    canonical: `${siteConfig.siteUrl}/v2/search/`,
  },
};

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        全文搜索
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        输入关键字，搜索文章标题和正文内容。
      </p>
      <SearchBox />
    </div>
  );
}
