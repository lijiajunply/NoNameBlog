import { Icon } from "@/components/mdx/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TimelineItem = {
  title: string;
  date?: string;
  description?: string;
  badge?: string;
  icon?: string;
  tags?: string[];
};

type TimelineProps = {
  title?: string;
  description?: string;
  items?: TimelineItem[];
  data?: TimelineItem[];
  className?: string;
};

export function Timeline({
  title,
  description,
  items = [],
  data = [],
  className,
}: TimelineProps) {
  const timelineItems = data.length ? data : items;

  if (!timelineItems.length) {
    return null;
  }

  return (
    <section
      className={cn(
        "my-5 overflow-hidden rounded-[28px] backdrop-blur-xl",
        className,
      )}
    >
      {title ? (
        <header className="mb-6">
          <h3 className="m-0 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 mb-0 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      <ol className="m-0 list-none p-0">
        {timelineItems.map((item, index) => {
          const isLast = index === timelineItems.length - 1;

          return (
            <li
              key={`${item.title}-${item.date ?? index}`}
              className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-4 pb-8 last:pb-0"
            >
              <div className="relative flex justify-center">
                {!isLast ? (
                  <span className="absolute top-10 bottom-[-2rem] left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-neutral-300 via-neutral-200 to-transparent dark:from-neutral-700 dark:via-neutral-800" />
                ) : null}
                <span className="relative z-10 mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                  {item.icon ? (
                    <Icon icon={item.icon} className="h-5 w-5" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  )}
                </span>
              </div>

              <article className="min-w-0 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-800/80 dark:bg-neutral-950/50">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {item.date ? (
                      <div className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                        {item.date}
                      </div>
                    ) : null}
                    <h4 className="m-0 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </h4>
                  </div>

                  {item.badge ? <Badge>{item.badge}</Badge> : null}
                </div>

                {item.description ? (
                  <p className="mt-3 mb-0 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
                    {item.description}
                  </p>
                ) : null}

                {item.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} className="bg-transparent">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
