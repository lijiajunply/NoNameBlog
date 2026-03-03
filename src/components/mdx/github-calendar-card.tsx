"use client";

import { useTheme } from "next-themes";
import { GitHubCalendar } from "react-github-calendar";
import { cn } from "@/lib/utils";

type GitHubCalendarCardProps = {
  username: string;
  year?: number;
  className?: string;
};

export function GitHubCalendarCard({
  username,
  year,
  className,
}: GitHubCalendarCardProps) {
  const { resolvedTheme } = useTheme();

  return (
    <section
      className={cn(
        "my-10 rounded-3xl border border-neutral-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 md:p-7",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          GitHub 贡献热力图
        </h3>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-neutral-100"
        >
          @{username}
        </a>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <GitHubCalendar
            username={username}
            year={year}
            colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
            blockSize={12}
            blockMargin={4}
            fontSize={13}
            showWeekdayLabels
            labels={{
              totalCount: "{{count}} 次贡献（过去一年）",
            }}
            theme={{
              light: ["#f3f4f6", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"],
              dark: ["#27272a", "#1e3a8a", "#1d4ed8", "#60a5fa", "#bfdbfe"],
            }}
          />
        </div>
      </div>
    </section>
  );
}
