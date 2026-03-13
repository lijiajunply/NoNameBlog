"use client";

import { Icon } from "@iconify/react";
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
  LoaderPinwheel
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type TaxonomyItem = {
  name: string;
  count: number;
};

type SidebarNavProps = {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
  routeBase?: string;
};

function normalizeRouteBase(routeBase: string) {
  if (!routeBase || routeBase === "/") {
    return "";
  }

  return routeBase.endsWith("/") ? routeBase.slice(0, -1) : routeBase;
}

function withRouteBase(routeBase: string, path: string) {
  const base = normalizeRouteBase(routeBase);
  return path === "/" ? `${base}/` || "/" : `${base}${path}/`;
}

function createNavItems(routeBase: string) {
  return [
    { href: withRouteBase(routeBase, "/"), label: "首页", icon: HomeIcon },
    {
      href: withRouteBase(routeBase, "/stats"),
      label: "统计",
      icon: ChartAreaIcon,
    },
    { href: withRouteBase(routeBase, "/about"), label: "关于", icon: InfoIcon },
    {
      href: withRouteBase(routeBase, "/friends"),
      label: "友链",
      icon: Link2Icon,
    },
    {
      href: withRouteBase(routeBase, "/moments"),
      label: "朋友圈",
      icon: LoaderPinwheel,
    },
    {
      href: withRouteBase(routeBase, "/write"),
      label: "写作",
      icon: FilePenLineIcon,
    }
  ] as const;
}

function isPathActive(pathname: string, href: string) {
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const normalizedHref =
    href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;

  if (normalizedHref === "/") {
    return normalizedPathname === "/";
  }

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

export function SidebarNav({
  categories,
  tags,
  routeBase = "",
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = normalizeRouteBase(routeBase);
  const navItems = createNavItems(base);
  const homeHref = withRouteBase(base, "/");
  const searchHref = withRouteBase(base, "/search");
  const categoriesPrefix = `${base}/categories/`;
  const tagsPrefix = `${base}/tags/`;
  const [searchQuery, setSearchQuery] = useState("");
  const isCategoryRoute = pathname.startsWith(categoriesPrefix);
  const isTagRoute = pathname.startsWith(tagsPrefix);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  useEffect(() => {
    if (pathname === searchHref) {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("q") ?? params.get("p") ?? "");
    } else {
      setSearchQuery("");
    }
  }, [pathname]);

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
              <Link href={homeHref}>
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

        <form
          className="group-data-[collapsible=icon]:hidden mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            const nextQuery = searchQuery.trim();
            const nextHref = nextQuery
              ? `${searchHref}?q=${encodeURIComponent(nextQuery)}`
              : searchHref;
            router.push(nextHref);
          }}
        >
          <SidebarGroup className="py-0 px-0">
            <SidebarGroupContent className="relative">
              <label htmlFor="search" className="sr-only">
                搜索
              </label>
              <SidebarInput
                id="search"
                placeholder="搜索..."
                className="pl-8 bg-neutral-100/50 dark:bg-neutral-800/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-neutral-300 dark:focus-visible:border-neutral-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>

        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="搜索"
              isActive={pathname === searchHref}
            >
              <Link href={searchHref}>
                <SearchIcon />
                <span>搜索</span>
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
                {categories.length
                  ? categories.map((category) => {
                    const href = `${categoriesPrefix}${encodeURIComponent(category.name)}`;
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
                  : null}
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
                {tags.length
                  ? tags.map((tag) => {
                    const href = `${tagsPrefix}${encodeURIComponent(tag.name)}`;
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
                  : null}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : null}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center group-data-[collapsible=icon]:hidden">
            <ButtonGroup>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={"icon-sm"}>
                    <a
                      href="https://github.com/lijiajunply"
                      target="_blank"
                      rel="noopener"
                      title="GitHub"
                    >
                      <Icon icon="lucide:github" width="16" height="16" className="text-zinc-800 dark:text-white"/>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Github 主页</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={"icon-sm"}>
                    <a
                      href="https://www.zhihu.com/people/peopleintheworld"
                      target="_blank"
                      rel="noopener"
                      title="知乎"
                    >
                      <Icon icon="simple-icons:zhihu" width="16" height="16" className="text-blue-500 dark:text-blue-400"/>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>知乎主页</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={"icon-sm"}>
                    <a
                      href="https://space.bilibili.com/8911949"
                      target="_blank"
                      rel="noopener"
                      title="哔哩哔哩"
                    >
                      <Icon icon="simple-icons:bilibili" width="16" height="16" className="text-pink-600 dark:text-pink-400"/>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>B站主页</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={"icon-sm"}>
                    <a
                      href="/rss.xml"
                      target="_blank"
                      rel="noopener"
                      title="Bilibili"
                    >
                      <Icon icon="heroicons:rss-16-solid" width="16" height="16" className="text-emerald-700 dark:text-emerald-300"/>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>RSS 订阅</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={"icon-sm"}>
                    <a
                      href="https://www.travellings.cn/go.html"
                      target="_blank"
                      rel="noopener"
                      title="开往-友链接力"
                    >
                      <Icon icon="fa7-solid:train-subway" width="16" height="16" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>开往-友链接力</p>
                </TooltipContent>
              </Tooltip>
            </ButtonGroup>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center justify-center mt-4 group-data-[collapsible=icon]:mt-0">
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
