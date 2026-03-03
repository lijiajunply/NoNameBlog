import {Icon} from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import AreaChart, {Area} from "@/components/charts/area-chart";
import {Grid} from "@/components/charts/grid";
import {ChartTooltip} from "@/components/charts/tooltip";
import {XAxis} from "@/components/charts/x-axis";
import {PostCard} from "@/components/post-card";
import {Badge} from "@/components/ui/badge";
import {siteConfig} from "@/config/site";
import {getAllPosts, getAllTags, getMonthlyCumulativeStats} from "@/lib/content/posts";

const POSTS_PER_PAGE = 8;

export const metadata: Metadata = {
    title: "首页",
    description: "浏览最新文章、热门标签与博客更新趋势。",
    alternates: {
        canonical: `${siteConfig.siteUrl}/`,
    },
};

export default function HomePage() {
    const posts = getAllPosts();
    const tags = getAllTags();
    const heroTags = tags.slice(0, 6);
    const pagedPosts = posts.slice(0, POSTS_PER_PAGE);
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const chartData = getMonthlyCumulativeStats();

    return (
        <div className="space-y-16">
            {/* Hero Section - Apple/macOS Glassmorphism Style */}
            <section
                className="relative overflow-hidden rounded-[30px] border border-black/5 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl md:p-14 dark:border-white/10 dark:bg-neutral-900/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
                    <div className="flex flex-col justify-center">
                        <div
                            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur-md dark:border-white/10 dark:bg-black/50 dark:text-neutral-300">
                            <Icon icon="ph:sparkle-duotone" className="text-blue-500"/>
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
                                    <Badge
                                        className="flex items-center gap-1.5 rounded-xl border-black/5 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-neutral-700 backdrop-blur-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
                                        <Icon icon="ph:hash-duotone" className="h-4 w-4"/>
                                        {tag.name}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div
                        className="group relative w-full overflow-hidden rounded-3xl border border-black/5  p-6 backdrop-blur-xl transition-all duration-300  dark:border-white/10  dark:hover:bg-black/60">
                        <div className="w-full">
                            <AreaChart
                                data={chartData}
                                margin={{top: 10, right: 10, bottom: 20, left: 10}}
                            >
                                <Grid horizontal numTicksRows={4}/>
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
                                <ChartTooltip/>
                                <XAxis numTicks={5}/>
                            </AreaChart>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Posts Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <Icon icon="ph:article-duotone" className="h-5 w-5"/>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                        最新文章
                    </h2>
                </div>
                <div className="grid gap-5">
                    {pagedPosts.map((post) => (
                        <div
                            key={post.slug}
                            className="transition-transform duration-300 hover:-translate-y-1"
                        >
                            <PostCard post={post}/>
                        </div>
                    ))}
                </div>
                {totalPages > 1 ? (
                    <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              第 1 / {totalPages} 页
            </span>
                        <Link
                            href="/page/2/"
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                            下一页
                            <Icon icon="ph:arrow-right" className="h-4 w-4"/>
                        </Link>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
