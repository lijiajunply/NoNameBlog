import { cn } from "@/lib/utils";

type Heading = {
  depth: 2 | 3;
  text: string;
  id: string;
};

export function PostToc({ headings }: { headings: Heading[] }) {
  if (!headings.length) {
    return null;
  }

  return (
    <aside className="sticky top-24 hidden max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-200/70 bg-white/80 p-4 backdrop-blur-xl lg:block dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        目录
      </h3>
      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        {headings.map((item) => (
          <li key={item.id}>
            <a
              className={cn(
                "block rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                item.depth === 3 &&
                  "ml-3 text-neutral-500 dark:text-neutral-400",
              )}
              href={`#${item.id}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
