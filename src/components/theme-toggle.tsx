"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[34px] w-[34px] md:w-[102px] items-center rounded-full bg-neutral-200/50 p-[3px] dark:bg-neutral-800/50">
        <div className="h-full w-full rounded-full bg-white/50 dark:bg-neutral-700/50" />
      </div>
    );
  }

  const themes = [
    { value: "light", icon: "lucide:sun", label: "亮色" },
    { value: "system", icon: "lucide:monitor", label: "系统" },
    { value: "dark", icon: "lucide:moon", label: "暗色" },
  ] as const;

  const handleThemeChange = (newTheme: string, e?: React.MouseEvent) => {
    // Fallback if view transitions are not supported or user prefers reduced motion
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      return;
    }

    const targetTheme =
      newTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : newTheme;

    if (targetTheme === resolvedTheme) {
      setTheme(newTheme);
      return;
    }

    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  // Single cycle toggle for mobile
  const currentThemeObj = themes.find((t) => t.value === theme) || themes[1];
  const cycleTheme = (e: React.MouseEvent) => {
    if (theme === "light") handleThemeChange("system", e);
    else if (theme === "system") handleThemeChange("dark", e);
    else handleThemeChange("light", e);
  };

  return (
    <>
      {/* Mobile & Collapsed Sidebar: Single cycling button */}
      <button
        onClick={cycleTheme}
        className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-neutral-200/50 p-[3px] shadow-inner backdrop-blur-xl transition-colors hover:bg-neutral-300/50 active:scale-95 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/50 md:group-data-[collapsible=icon]:flex md:hidden"
        aria-label={`当前主题: ${currentThemeObj.label}，点击切换`}
        title={`当前主题: ${currentThemeObj.label}`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100">
          <Icon icon={currentThemeObj.icon} className="h-4 w-4" />
        </div>
      </button>

      {/* Desktop Expanded: Apple-style Segmented Control */}
      <div
        className="hidden md:group-data-[collapsible=icon]:hidden md:flex relative items-center rounded-full bg-neutral-200/50 p-[3px] shadow-inner backdrop-blur-xl transition-colors duration-300 dark:bg-neutral-800/50"
        role="radiogroup"
        aria-label="切换主题"
      >
        {themes.map((t) => {
          const isActive = theme === t.value;
          return (
            <button
              key={t.value}
              onClick={(e) => handleThemeChange(t.value, e)}
              className={`relative flex h-7 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
              role="radio"
              aria-checked={isActive}
              title={t.label}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-neutral-700" />
              )}
              <Icon
                icon={t.icon}
                className={`relative z-10 h-4 w-4 transition-transform duration-300 ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
