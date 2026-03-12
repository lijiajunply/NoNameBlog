import type { Metadata } from "next";
import { SearchBox } from "@/components/search-box";
import { siteConfig } from "@/config/site";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = {
  params: Promise<{ keyword?: string[] }>;
};

export function generateStaticParams() {
  return [{ keyword: undefined }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { keyword } = await params;
  const searchTerm = keyword?.[0];

  return {
    title: searchTerm ? `搜索: ${searchTerm}` : "搜索",
    description: "按关键字检索博客文章标题与正文。",
    alternates: {
      canonical: `${siteConfig.siteUrl}/v2/search/`,
    },
  };
}

export default async function SearchPage({ params }: Props) {
  const { keyword } = await params;
  const [searchTerm, setSearchTerm] = useState(keyword?.[0] || "");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        全文搜索
      </h1>

    {searchTerm ? <Input placeholder="搜索..." defaultValue={searchTerm} onChange={x => setSearchTerm(x.target.value)} /> : <SearchBox initialKeyword={searchTerm} />}

    </div>
  );
}
