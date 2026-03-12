import type { Metadata } from "next";
import { PostFeedWithCategoryFilter } from "@/components/post-feed-with-category-filter";
import { siteConfig } from "@/config/site";
import {
  getAllPosts
} from "@/lib/content/posts";

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

  return (
    <div className="space-y-16">
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
