import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search-page-client";
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
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
