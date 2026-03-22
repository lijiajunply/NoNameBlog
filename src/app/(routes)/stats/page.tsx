import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import AreaChart, { Area } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { siteConfig } from "@/config/site";
import {
  getAllCategories,
  getAllPosts,
  getAllTags,
  getMonthlyCumulativeStats,
} from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "统计",
  alternates: {
    canonical: `${siteConfig.siteUrl}/stats/`,
  },
};

export default function StatsPage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const categories = getAllCategories();
  const monthlyCumulative = getMonthlyCumulativeStats();
  const latestPostDate = posts[0]?.frontmatter.date;

  return (
    <div className="space-y-12 pb-16">
      {/* Header Section */}
      <div className="space-y-4 px-2 sm:px-0">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          统计数据
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400">
          探索站点的成长轨迹与内容沉淀。
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Posts Card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:hover:bg-neutral-900/80 dark:hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)]">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                总文章
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-blue-500/10 text-blue-500 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400">
                <Icon icon="solar:document-text-bold-duotone" className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {posts.length}
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                篇原创内容
              </p>
            </div>
          </div>
        </div>

        {/* Total Tags Card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:hover:bg-neutral-900/80 dark:hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)]">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                总标签
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-emerald-500/10 text-emerald-500 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Icon icon="solar:tag-bold-duotone" className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {tags.length}
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                个知识维度
              </p>
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:hover:bg-neutral-900/80 dark:hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)]">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                分类数
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-amber-500/10 text-amber-500 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400">
                <Icon icon="solar:folder-with-files-bold-duotone" className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {categories.length}
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                个系统分类
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated Card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:hover:bg-neutral-900/80 dark:hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)]">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                最近更新
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-purple-500/10 text-purple-500 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-500/20 dark:text-purple-400">
                <Icon icon="solar:calendar-date-bold-duotone" className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-2xl xl:text-3xl dark:text-white">
                {latestPostDate ? formatDate(latestPostDate) : "暂无"}
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                活跃时间
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="overflow-hidden rounded-[2.5rem] border border-black/5 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              内容增长趋势
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              文章与标签的每月累计数量
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full sm:h-[400px]">
          <AreaChart
            data={monthlyCumulative}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            className="h-full w-full"
          >
            <Grid horizontal numTicksRows={5} />
            <Area
              dataKey="posts"
              fill="var(--chart-line-primary)"
              fillOpacity={0.15}
              stroke="var(--chart-line-primary)"
              strokeWidth={3}
            />
            <Area
              dataKey="tags"
              fill="var(--chart-line-secondary)"
              fillOpacity={0.08}
              stroke="var(--chart-line-secondary)"
              strokeWidth={3}
            />
            <ChartTooltip />
            <XAxis numTicks={6} />
          </AreaChart>
        </div>
      </div>
    </div>
  );
}
