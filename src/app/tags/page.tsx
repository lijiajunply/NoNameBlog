import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllTags } from "@/lib/content/posts";

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        标签
      </h1>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
            <Badge className="px-3 py-1.5 text-sm">
              #{tag.name} · {tag.count}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
