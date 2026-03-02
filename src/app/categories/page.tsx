import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllCategories } from "@/lib/content/posts";

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        分类
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        共 {categories.length} 个分类
      </p>
      <div className="flex flex-wrap gap-2.5">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/categories/${encodeURIComponent(category.name)}`}
          >
            <Badge className="text-sm">
              {category.name} ({category.count})
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
