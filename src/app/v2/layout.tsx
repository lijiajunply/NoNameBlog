import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { V2PageTitle } from "@/components/v2-page-title";
import { V2SidebarNav } from "@/components/v2-sidebar-nav";
import { getAllCategories, getAllPosts, getAllTags } from "@/lib/content/posts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = getAllCategories().slice(0, 8);
  const tags = getAllTags().slice(0, 12);
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    category: post.frontmatter.category,
  }));

  return (
    <SidebarProvider>
      <V2SidebarNav categories={categories} tags={tags} />
      <SidebarInset className="p-0! min-h-screen dark:bg-[radial-gradient(circle_at_15%_10%,rgba(199,210,254,0.25),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(251,191,36,0.15),transparent_35%)]">
        <header className="sticky top-0 z-40 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md dark:border-neutral-800/50 dark:bg-black/70">
          <div className="flex h-14 w-full max-w-6xl items-center gap-3 px-6 md:px-10">
            <SidebarTrigger />
            <V2PageTitle posts={posts} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:px-10">
          {children}
        </main>
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
