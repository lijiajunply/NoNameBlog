import type { Metadata } from "next";
import { PostFeedWithCategoryFilter } from "@/components/post-feed-with-category-filter";
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
    canonical: `${siteConfig.siteUrl}/v2/`,
  },
};

export default function HomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const heroTags = tags.slice(0, 6);
  const chartData = getMonthlyCumulativeStats();

  return (
    <div className="space-y-16">
      {/* Latest Posts Section */}
      <section className="space-y-6">
        <PostFeedWithCategoryFilter
          posts={posts}
          postsPerPage={POSTS_PER_PAGE}
          routeBase="/v2"
        />
      </section>
    </div>
  );
}
