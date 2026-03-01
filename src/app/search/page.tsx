import { SearchBox } from "@/components/search-box";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        全文搜索
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        输入关键字，搜索文章标题和正文内容。
      </p>
      <SearchBox />
    </div>
  );
}
