"use client";

import {
  ChartAreaIcon,
  ChevronRightIcon,
  FilePenLineIcon,
  FolderIcon,
  HomeIcon,
  InfoIcon,
  Link2Icon,
  SearchIcon,
  TagIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type TaxonomyItem = {
  name: string;
  count: number;
};

type V2SidebarNavProps = {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
};

const navItems = [
  { href: "/v2/", label: "首页", icon: HomeIcon },
  { href: "/v2/search/", label: "搜索", icon: SearchIcon },
  { href: "/v2/stats/", label: "统计", icon: ChartAreaIcon },
  { href: "/v2/about/", label: "关于", icon: InfoIcon },
  { href: "/v2/friends/", label: "友链", icon: Link2Icon },
  { href: "/v2/write/", label: "写作", icon: FilePenLineIcon },
] as const;

function isPathActive(pathname: string, href: string) {
  if (href === "/v2/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href);
}

export function V2SidebarNav({ categories, tags }: V2SidebarNavProps) {
  const pathname = usePathname();
  const isCategoryRoute = pathname.startsWith("/v2/categories/");
  const isTagRoute = pathname.startsWith("/v2/tags/");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isTagOpen, setIsTagOpen] = useState(true);

  useEffect(() => {
    if (isCategoryRoute) {
      setIsCategoryOpen(true);
    }
  }, [isCategoryRoute]);

  useEffect(() => {
    if (isTagRoute) {
      setIsTagOpen(true);
    }
  }, [isTagRoute]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/v2/">
                <Image
                  src="/favicon.ico"
                  className="h-8 w-8 rounded-sm"
                  alt=""
                  width={32}
                  height={32}
                />
                <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {siteConfig.siteName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>分类</SidebarGroupLabel>
          <SidebarGroupAction
            aria-label={isCategoryOpen ? "收起分类" : "展开分类"}
            onClick={() => setIsCategoryOpen((open) => !open)}
            title={isCategoryOpen ? "收起分类" : "展开分类"}
          >
            <ChevronRightIcon
              className={cn(
                "transition-transform duration-200",
                isCategoryOpen ? "rotate-90" : "rotate-0",
              )}
            />
          </SidebarGroupAction>
          {isCategoryOpen ? (
            <SidebarGroupContent>
              <SidebarMenu>
                {categories.length ? (
                  categories.map((category) => {
                    const href = `/v2/categories/${encodeURIComponent(category.name)}`;
                    return (
                      <SidebarMenuItem key={category.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === href}
                          tooltip={category.name}
                        >
                          <Link href={href}>
                            <FolderIcon />
                            <span>{category.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>{category.count}</SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <p className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
                    暂无分类
                  </p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : null}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>标签</SidebarGroupLabel>
          <SidebarGroupAction
            aria-label={isTagOpen ? "收起标签" : "展开标签"}
            onClick={() => setIsTagOpen((open) => !open)}
            title={isTagOpen ? "收起标签" : "展开标签"}
          >
            <ChevronRightIcon
              className={cn(
                "transition-transform duration-200",
                isTagOpen ? "rotate-90" : "rotate-0",
              )}
            />
          </SidebarGroupAction>
          {isTagOpen ? (
            <SidebarGroupContent>
              <SidebarMenu>
                {tags.length ? (
                  tags.map((tag) => {
                    const href = `/v2/tags/${encodeURIComponent(tag.name)}`;
                    return (
                      <SidebarMenuItem key={tag.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === href}
                          tooltip={tag.name}
                        >
                          <Link href={href}>
                            <TagIcon />
                            <span>{tag.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>{tag.count}</SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <p className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
                    暂无标签
                  </p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : null}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="RSS">
              <Link href="/rss.xml">RSS</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sitemap">
              <Link href="/sitemap.xml">Sitemap</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
