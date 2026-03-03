import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { renderMdx } from "@/lib/content/mdx";
import { getAboutPageSource } from "@/lib/content/posts";

export const metadata: Metadata = {
  title: "关于",
  description: "关于作者、技术栈与博客定位的介绍。",
  alternates: {
    canonical: `${siteConfig.siteUrl}/about/`,
  },
};

export default async function AboutPage() {
  const source = getAboutPageSource();
  const content = await renderMdx(source);

  return (
    <article className="rounded-3xl p-7 md:p-10">
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {content}
      </div>
    </article>
  );
}
