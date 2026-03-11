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
import { ThemeToggle } from "./theme-toggle";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import { Icon } from "@iconify/react";

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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

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

      <SidebarContent className={'overflow-y-hidden hover:overflow-auto'}>
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
                ) : (<></>)}
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
                  <></>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : null}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center">
            <ButtonGroup>
              <Button variant="outline" size={'icon-sm'}>
                <a href="https://github.com/lijiajunply" target="_blank" rel="noopener" title="GitHub">
                  <Icon icon="lucide:github" width="16" height="16" />
                </a>
              </Button>
              <Button variant="outline" size={'icon-sm'}>
                <a href="https://www.zhihu.com/people/peopleintheworld" target="_blank" rel="noopener" title="知乎">
                  <Icon icon="simple-icons:zhihu" width="16" height="16" />
                </a>
              </Button>
              <Button variant="outline" size={'icon-sm'}>
                <a href="https://space.bilibili.com/8911949" target="_blank" rel="noopener" title="哔哩哔哩">
                  <Icon icon="simple-icons:bilibili" width="16" height="16" />
                </a>
              </Button>
              <Button variant="outline" size={'icon-sm'}>
                <a href="/rss.xml" target="_blank" rel="noopener" title="Bilibili">
                <Icon icon="heroicons:rss-16-solid" width="16" height="16" />
                </a>
              </Button>
              <Button variant="outline" size={'icon-sm'}>
                <a href="https://www.travellings.cn/go.html" target="_blank" rel="noopener" title="开往-友链接力">
                  <Icon icon="fa7-solid:train-subway" width="16" height="16" />
                </a>
              </Button>
            </ButtonGroup>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center justify-center mt-4">
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
