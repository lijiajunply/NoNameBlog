import { SiteFooter } from "@/components/site-footer";
import { HeaderSlot, HeaderSlotProvider } from "@/components/header-slot";
import { PageTitle } from "@/components/page-title";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getAllCategories, getAllPosts, getAllTags } from "@/lib/content/posts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = getAllCategories();
  const tags = getAllTags();
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    category: post.frontmatter.category,
  }));

  return (
    <SidebarProvider>
      <SidebarNav categories={categories} tags={tags} />
      <SidebarInset className="p-0! bg-fixed min-h-screen dark:bg-[radial-gradient(circle_at_15%_10%,rgba(199,210,254,0.25),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(251,191,36,0.15),transparent_35%)]">
        <HeaderSlotProvider>
          <header className="sticky top-0 z-40 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md dark:border-neutral-800/50 dark:bg-black/70">
            <div className="flex h-14 w-full items-center gap-3 px-4 md:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger />
                <PageTitle posts={posts} categories={categories} tags={tags} />
              </div>
              <div className="ml-auto min-w-0">
                <HeaderSlot />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full container flex-1 px-6 py-8 md:px-10 dark:bg-transparent">
            {children}
          </main>
          <SiteFooter />
        </HeaderSlotProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
