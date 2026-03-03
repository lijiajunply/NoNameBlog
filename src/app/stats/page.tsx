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
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const latestMonth = monthlyCumulative[monthlyCumulative.length - 1];
  const latestPostDate = posts[0]?.frontmatter.date;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Icon icon="mingcute:chart-line-line" className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            站点统计
          </h1>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-white/75 p-4 dark:border-white/10 dark:bg-neutral-900/70">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              总文章
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
              {posts.length}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/75 p-4 dark:border-white/10 dark:bg-neutral-900/70">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              总标签
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
              {tags.length}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/75 p-4 dark:border-white/10 dark:bg-neutral-900/70">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              分类数
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
              {categories.length}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/75 p-4 dark:border-white/10 dark:bg-neutral-900/70">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              最近更新
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
              {latestPostDate ? formatDate(latestPostDate) : "暂无"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            每月累计（文章 / 标签）
          </h2>
          {latestMonth ? (
            <span className="rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs text-neutral-600 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300">
              当前累计 {latestMonth.posts} 篇，{latestMonth.tags} 个标签
            </span>
          ) : null}
        </div>

        <AreaChart data={monthlyCumulative} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
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
          <XAxis numTicks={6} />
        </AreaChart>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Icon icon="mingcute:google-line" className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Google Analytics 接入状态
          </h2>
        </div>

        {gaMeasurementId ? (
          <div className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <p>
              已检测到 <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code>，站点已注入
              gtag.js。
            </p>
            <p>
              当前 Measurement ID:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                {gaMeasurementId}
              </code>
            </p>
            <p>下一步可以接入 GA Data API，把 PV/UV/来源等数据拉到该页面展示。</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <p>
              尚未配置 GA。请在环境变量中设置{" "}
              <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code>。
            </p>
            <p>
              例如：
              <code className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
              </code>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
