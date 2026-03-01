import { renderMdx } from "@/lib/content/mdx";
import { getAboutPageSource } from "@/lib/content/posts";

export default async function AboutPage() {
  const source = getAboutPageSource();
  const content = await renderMdx(source);

  return (
    <article className="rounded-3xl border border-neutral-200/70 bg-white/75 p-7 md:p-10 dark:border-neutral-800/80 dark:bg-neutral-900/75">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        关于
      </h1>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {content}
      </div>
    </article>
  );
}
