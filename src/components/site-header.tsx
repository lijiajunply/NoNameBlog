"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SearchBox } from "@/components/search-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: "mingcute:home-5-line" },
  { href: "/tags", label: "标签", icon: "mingcute:tag-2-line" },
  { href: "/categories", label: "分类", icon: "mingcute:list-check-2-line" },
  { href: "/about", label: "关于", icon: "mingcute:information-line" },
  { href: "/friends", label: "友链", icon: "mingcute:group-line" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Prevent body scroll when overlays are open
  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/40 bg-white/70 backdrop-blur-md transition-colors duration-300 dark:border-neutral-800/40 dark:bg-black/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsSearchOpen(false);
          }}
          className="group flex items-center gap-2 text-[15px] font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-80 dark:text-white"
        >
          <Image
            src={"/favicon.ico"}
            alt={"favicon.ico"}
            className={"rounded-sm"}
            width={32}
            height={32}
          />
          <span className="hidden sm:inline-block">{siteConfig.siteName}</span>
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(false);
                }}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 z-0 rounded-full bg-neutral-100 dark:bg-neutral-800"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200 active:scale-95 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            aria-label="打开搜索"
          >
            <Icon
              icon="mingcute:search-2-line"
              className="h-5 w-5 text-neutral-900 dark:text-white"
            />
          </button>
          <ThemeToggle />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200 active:scale-95 dark:bg-neutral-800 dark:hover:bg-neutral-700 md:hidden"
            aria-label="Toggle mobile menu"
          >
            <Icon
              icon={
                isMobileMenuOpen ? "mingcute:close-line" : "mingcute:menu-line"
              }
              className="h-5 w-5 text-neutral-900 dark:text-white"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 h-[calc(100vh-64px)] border-t border-neutral-200/40 bg-white/95 backdrop-blur-xl dark:border-neutral-800/40 dark:bg-black/95 md:hidden"
          >
            <nav className="flex flex-col gap-2 p-6">
              {navItems.map((item, idx) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl p-4 text-lg font-medium transition-all active:scale-[0.98]",
                      pathname === item.href
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        pathname === item.href
                          ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                          : "bg-neutral-50 text-neutral-400 dark:bg-neutral-900",
                      )}
                    >
                      <Icon icon={item.icon} className="h-5 w-5" />
                    </div>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="absolute bottom-10 left-0 right-0 px-6 text-center text-xs text-neutral-400">
              © {new Date().getFullYear()} {siteConfig.siteName}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      {isMounted
        ? createPortal(
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[999] bg-black/50 p-4 backdrop-blur-sm md:p-8"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto mt-12 w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 md:mt-20 md:p-6"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        全文搜索
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                        aria-label="关闭搜索"
                      >
                        <Icon icon="mingcute:close-line" className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="search-modal-body">
                      <SearchBox />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </header>
  );
}
