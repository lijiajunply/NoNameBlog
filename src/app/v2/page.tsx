import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import AreaChart, { Area } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { PostFeedWithCategoryFilter } from "@/components/post-feed-with-category-filter";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import {
  getAllPosts,
  getAllTags,
  getMonthlyCumulativeStats,
} from "@/lib/content/posts";

const POSTS_PER_PAGE = 8;

export const metadata: Metadata = {
  title: "NoName Blog",
  description: "浏览最新文章、热门标签与博客更新趋势。",
  alternates: {
    canonical: `${siteConfig.siteUrl}/`,
  },
};

export default function HomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const heroTags = tags.slice(0, 6);
  const chartData = getMonthlyCumulativeStats();

  return (
    <div className="space-y-16">
      {/* Hero Section - Apple/macOS Glassmorphism Style */}
      <section className="relative overflow-hidden rounded-[30px] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl md:p-14 dark:border-white/10 dark:bg-neutral-900/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur-md dark:border-white/10 dark:bg-black/50 dark:text-neutral-300">
              <Icon icon="ph:sparkle-duotone" className="text-blue-500" />
              <span>没有名字的博客</span>
            </div>

            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 md:text-5xl lg:text-[3.5rem] dark:text-white">
              一条鱼的自娱自乐
            </h1>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {heroTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  <Badge className="flex items-center gap-1.5 rounded-xl border-black/5 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-neutral-700 backdrop-blur-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
                    <Icon icon="ph:hash-duotone" className="h-4 w-4" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:block group relative w-full overflow-hidden rounded-3xl border border-black/5  p-6 backdrop-blur-xl transition-all duration-300  dark:border-white/10  dark:hover:bg-black/60">
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
        <PostFeedWithCategoryFilter
          posts={posts}
          postsPerPage={POSTS_PER_PAGE}
        />
      </section>
    </div>
  );
}
