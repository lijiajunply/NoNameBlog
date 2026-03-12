import type { Metadata } from "next";
import { WritePageClient } from "@/components/write-page-client";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "写作",
  description: "在线撰写并预览 Markdown/MDX 内容。",
  alternates: {
    canonical: `${siteConfig.siteUrl}/write/`,
  },
};

export default function WritePage() {
  return <WritePageClient />;
}
