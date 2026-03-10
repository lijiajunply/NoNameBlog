"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { renderMdx } from "@/lib/content/mdx";

const editorExtensions = [
  markdown({
    base: markdownLanguage,
    codeLanguages: languages,
    addKeymap: true,
  }),
  EditorView.lineWrapping, // 启用行内换行
];
const PREVIEW_DEBOUNCE_MS = 150;

const initialSource = `# 标题
## 标题
### 标题
#### 标题
##### 标题
###### 标题

> 引用

- 列表
- 列表
- 列表

1. 列表
2. 列表
3. 列表

[链接](https://blog.luckyfishes.site)

![图片](https://blog.luckyfishes.site/favicon.ico)
`;

export default function WritePage() {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState(initialSource);
  const [content, setContent] = useState<ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const taskIdRef = useRef(0);

  useEffect(() => {
    let unmounted = false;
    const timeoutId = window.setTimeout(() => {
      const currentTaskId = ++taskIdRef.current;
      setRenderError(null);

      void renderMdx(value)
        .then((nextContent) => {
          if (unmounted || currentTaskId !== taskIdRef.current) {
            return;
          }

          setContent(nextContent);
        })
        .catch((error: unknown) => {
          if (unmounted || currentTaskId !== taskIdRef.current) {
            return;
          }

          setContent(null);
          setRenderError(
            error instanceof Error
              ? error.message
              : "渲染失败，请检查 MDX 语法。",
          );
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      unmounted = true;
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <div className="mx-auto grid min-h-[36rem] grid-cols-1 gap-6 lg:h-[calc(100vh-250px)] lg:grid-cols-2">
      <section className="h-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 relative pt-2 bg-gray-100 dark:bg-gray-900">
        <span className="code-mac-dots" aria-hidden />
        <CodeMirror
          value={value}
          height="100%"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
          extensions={editorExtensions}
          onChange={(nextValue) => {
            setValue(nextValue);
          }}
          theme={resolvedTheme === "dark" ? atomone : vscodeLight}
          className="h-full mt-5 text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
        />
      </section>
      <article className="prose prose-neutral max-w-none overflow-auto rounded-2xl border border-neutral-200 p-6 dark:prose-invert dark:border-neutral-800">
        {renderError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {renderError}
          </p>
        ) : (
          content
        )}
      </article>
    </div>
  );
}
