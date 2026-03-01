import Link from "next/link";
import { Icon } from "@iconify/react";
import AreaChart, { Area } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getAllTags } from "@/lib/content/posts";

export default function HomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const heroTags = tags.slice(0, 6);
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
    <div className="space-y-16">
      {/* Hero Section - Apple/macOS Glassmorphism Style */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl md:p-14 dark:border-white/10 dark:bg-black/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        {/* Subtle background gradients for visual depth */}
        <div className="pointer-events-none absolute -top-40 -right-40 -z-10 h-125 w-125 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/20" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 -z-10 h-125 w-125 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/20" />
        
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur-md dark:border-white/10 dark:bg-black/50 dark:text-neutral-300">
              <Icon icon="ph:sparkle-duotone" className="text-blue-500" />
              <span>没有名字的博客</span>
            </div>
            
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 md:text-5xl lg:text-[3.5rem] dark:text-white">
              内容驱动设计，
              <br className="hidden md:block" />
              <span className="text-neutral-500 dark:text-neutral-400">系统思维写作。</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              记录前端工程、设计系统和产品实现细节。追求简约、克制和可读性的阅读体验。
            </p>
            
            <div className="mt-8 flex flex-wrap gap-2.5">
              {heroTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  <Badge className="flex items-center gap-1.5 rounded-xl border-black/5 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
                    <Icon icon="ph:hash-duotone" className="h-4 w-4" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="group relative w-full overflow-hidden rounded-3xl border border-black/5 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-black/50 dark:hover:bg-black/60">
            <div className="w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
              >
                <Grid horizontal numTicksRows={4} />
                <Area
                  dataKey="posts"
                  fill="var(--chart-line-primary)"
                  fillOpacity={0.2}
                  stroke="var(--chart-line-primary)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="tags"
                  fill="var(--chart-line-secondary)"
                  fillOpacity={0.1}
                  stroke="var(--chart-line-secondary)"
                  strokeWidth={2}
                />
                <ChartTooltip />
                <XAxis numTicks={5} />
              </AreaChart>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Icon icon="ph:article-duotone" className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            最新文章
          </h2>
        </div>
        <div className="grid gap-5">
          {posts.map((post) => (
            <div key={post.slug} className="transition-transform duration-300 hover:-translate-y-1">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
