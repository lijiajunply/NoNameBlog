import Link from "next/link";
import AreaChart, { Area } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { getAllCategories, getAllPosts, getAllTags } from "@/lib/content/posts";

export default function HomePage() {
  const posts = getAllPosts();
  const categories = getAllCategories().slice(0, 6);
  const tags = getAllTags().slice(0, 10);
  const chartData = [
    { date: "2025-08-01", posts: 1, tags: 2 },
    { date: "2025-09-01", posts: 2, tags: 3 },
    { date: "2025-10-01", posts: 2, tags: 4 },
    { date: "2025-11-01", posts: 3, tags: 5 },
    { date: "2025-12-01", posts: 3, tags: 7 },
    { date: "2026-01-01", posts: 4, tags: 8 },
    { date: "2026-02-01", posts: 5, tags: 10 },
    { date: "2026-03-01", posts: posts.length, tags: tags.length + 6 },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-neutral-200/70 bg-white/75 p-8 shadow-[0_15px_50px_-35px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12 dark:border-neutral-800/80 dark:bg-neutral-900/75">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-neutral-500">
              静态博客
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
              用内容驱动设计，用系统思维写博客。
            </h1>
            <p className="mt-5 max-w-2xl text-neutral-600 dark:text-neutral-300">
              这里记录前端工程、设计系统和产品实现细节。界面追求简约、克制和可读性。
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/categories/${encodeURIComponent(category.name)}`}
                >
                  <Badge>{category.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
            <p className="mb-3 text-sm text-neutral-500">
              内容增长趋势（bklit）
            </p>
            <AreaChart
              data={chartData}
              margin={{ top: 24, right: 16, bottom: 28, left: 8 }}
            >
              <Grid horizontal numTicksRows={4} />
              <Area
                dataKey="posts"
                fill="var(--chart-line-primary)"
                fillOpacity={0.35}
              />
              <Area
                dataKey="tags"
                fill="var(--chart-line-secondary)"
                fillOpacity={0.15}
              />
              <ChartTooltip />
              <XAxis numTicks={5} />
            </AreaChart>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          最新文章
        </h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          热门标签
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
              <Badge>
                #{tag.name} · {tag.count}
              </Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
