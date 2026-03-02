"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {ThemeToggle} from "@/components/theme-toggle";
import {siteConfig} from "@/config/site";
import {Icon} from "@iconify/react";
import {motion, AnimatePresence} from "motion/react";
import {useState, useEffect} from "react";
import {cn} from "@/lib/utils";
import Image from "next/image";

const navItems = [
    {href: "/", label: "首页", icon: "mingcute:home-5-line"},
    {href: "/tags", label: "标签", icon: "mingcute:tag-2-line"},
    {href: "/categories", label: "分类", icon: "mingcute:list-check-2-line"},
    {href: "/about", label: "关于", icon: "mingcute:information-line"},
    {href: "/friends", label: "友链", icon: "mingcute:group-line"},
    {href: "/search", label: "搜索", icon: "mingcute:search-2-line"},
];

export function SiteHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-neutral-200/40 bg-white/70 backdrop-blur-md transition-colors duration-300 dark:border-neutral-800/40 dark:bg-black/70">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
                {/* Logo */}
                <Link
                    href="/"
                    className="group flex items-center gap-2 text-[15px] font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-80 dark:text-white"
                >
                    <Image src={'favicon.ico'} alt={"favicon.ico"} className={'h-8 w-8'} width={32} height={32}/>
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
                                className={cn(
                                    "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300",
                                    isActive
                                        ? "text-neutral-900 dark:text-white"
                                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                )}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="absolute inset-0 z-0 rounded-full bg-neutral-100 dark:bg-neutral-800"
                                        transition={{type: "spring", bounce: 0.25, duration: 0.5}}
                                    />
                                )}
                                <span className="relative z-10">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle/>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200 active:scale-95 dark:bg-neutral-800 dark:hover:bg-neutral-700 md:hidden"
                        aria-label="Toggle mobile menu"
                    >
                        <Icon
                            icon={isMobileMenuOpen ? "mingcute:close-line" : "mingcute:menu-line"}
                            className="h-5 w-5 text-neutral-900 dark:text-white"
                        />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        transition={{duration: 0.2}}
                        className="fixed inset-x-0 top-16 z-40 h-[calc(100vh-64px)] border-t border-neutral-200/40 bg-white/95 backdrop-blur-xl dark:border-neutral-800/40 dark:bg-black/95 md:hidden"
                    >
                        <nav className="flex flex-col gap-2 p-6">
                            {navItems.map((item, idx) => (
                                <motion.div
                                    key={item.href}
                                    initial={{opacity: 0, x: -20}}
                                    animate={{opacity: 1, x: 0}}
                                    transition={{delay: idx * 0.05}}
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 rounded-2xl p-4 text-lg font-medium transition-all active:scale-[0.98]",
                                            pathname === item.href
                                                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                                                : "text-neutral-500 dark:text-neutral-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl",
                                            pathname === item.href
                                                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                                                : "bg-neutral-50 text-neutral-400 dark:bg-neutral-900"
                                        )}>
                                            <Icon icon={item.icon} className="h-5 w-5"/>
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
        </header>
    );
}
