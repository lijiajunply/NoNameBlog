"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Icon } from "@iconify/react";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHeaderSlotContext } from "@/components/header-slot";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { renderMdx } from "@/lib/content/mdx";
import { cn } from "@/lib/utils";

const editorExtensions = [
  markdown({
    base: markdownLanguage,
    codeLanguages: languages,
    addKeymap: true,
  }),
  EditorView.lineWrapping,
];
const PREVIEW_DEBOUNCE_MS = 180;
const SAVE_DEBOUNCE_MS = 900;
const STORAGE_KEY = "mdx-editor-content";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ViewMode = "edit" | "preview" | "split";

const initialSource = `# 欢迎使用

在这里可以自由撰写 MDX，并实时查看渲染效果。

## 当前支持

- 自动保存，刷新页面后不会消失，可以继续编辑
- 实时 MDX 预览
- 一键导出 \`.mdx\`
- 复制源码到剪贴板

\`\`\`typescript
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`;

export function WritePageClient() {
  const { resolvedTheme } = useTheme();
  const { setHeaderContent, clearHeaderContent } = useHeaderSlotContext();
  const [value, setValue] = useState(initialSource);
  const [content, setContent] = useState<ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("edit");
  const [isDesktop, setIsDesktop] = useState(false);
  const isInitialMount = useRef(true);
  const hasInitializedView = useRef(false);
  const taskIdRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateIsDesktop = (event?: MediaQueryListEvent) => {
      const nextDesktop = event ? event.matches : mediaQuery.matches;
      setIsDesktop(nextDesktop);

      if (!hasInitializedView.current) {
        setActiveView(nextDesktop ? "split" : "edit");
        hasInitializedView.current = true;
        return;
      }

      if (!nextDesktop) {
        setActiveView((current) => (current === "split" ? "edit" : current));
      }
    };

    updateIsDesktop();
    mediaQuery.addEventListener("change", updateIsDesktop);

    return () => {
      mediaQuery.removeEventListener("change", updateIsDesktop);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setValue(saved || initialSource);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value]);

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

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionMessage(null);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionMessage]);

  const wordCount = useMemo(() => {
    const text = value.trim();
    if (!text) {
      return 0;
    }
    return text.split(/\s+/).filter(Boolean).length;
  }, [value]);

  const charCount = useMemo(() => value.length, [value]);

  const saveLabel =
    saveStatus === "saving"
      ? "保存中"
      : saveStatus === "saved"
        ? "已保存"
        : saveStatus === "error"
          ? "保存失败"
          : "草稿未保存";

  const saveIcon =
    saveStatus === "saving"
      ? "mingcute:loading-3-line"
      : saveStatus === "saved"
        ? "mingcute:check-line"
        : saveStatus === "error"
          ? "mingcute:warning-line"
          : "mingcute:time-line";

  const handleExport = useCallback(() => {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const localDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    a.download = `write-studio-${localDate}.mdx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionMessage("已导出 MDX 文件");
  }, [value]);

  const handleClear = useCallback(() => {
    if (window.confirm("确定要清空当前内容吗？此操作不可撤销。")) {
      setValue("");
      localStorage.removeItem(STORAGE_KEY);
      setSaveStatus("idle");
      setActionMessage("内容已清空");
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setActionMessage("已复制到剪贴板");
    } catch {
      setActionMessage("复制失败，请检查浏览器权限");
    }
  }, [value]);

  const headerContent = useMemo(
    () => (
      <WriteHeaderControls
        activeView={activeView}
        isDesktop={isDesktop}
        onChangeView={setActiveView}
        onCopy={handleCopy}
        onExport={handleExport}
        onClear={handleClear}
        saveIcon={saveIcon}
        saveLabel={saveLabel}
        wordCount={wordCount}
        charCount={charCount}
      />
    ),
    [
      activeView,
      isDesktop,
      saveIcon,
      saveLabel,
      wordCount,
      charCount,
      handleCopy,
      handleExport,
      handleClear,
    ],
  );

  useEffect(() => {
    setHeaderContent(headerContent);

    return () => {
      clearHeaderContent();
    };
  }, [headerContent, setHeaderContent, clearHeaderContent]);

  return (
    <div className="relative flex flex-col gap-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 z-0 h-56 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--foreground)_9%,transparent),transparent_65%)] blur-3xl"
      />

      <Card className="relative z-10 lg:hidden rounded-[1.25rem] border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_90%,transparent)] p-3">
        <div className="flex items-center gap-2 text-xs text-[color-mix(in_srgb,var(--foreground)_66%,transparent)]">
          <Icon
            icon={saveIcon}
            className={saveStatus === "saving" ? "animate-spin" : undefined}
          />
          <span>{saveLabel}</span>
          <span>·</span>
          <span>
            {wordCount} 词 · {charCount} 字符
          </span>
        </div>
      </Card>

      {actionMessage ? (
        <p className="relative z-10 text-xs text-[color-mix(in_srgb,var(--foreground)_68%,transparent)]">
          {actionMessage}
        </p>
      ) : null}

      <Tabs value={activeView} className="relative z-10">
        <TabsContent value="edit" className="mt-0">
          <EditorPanel
            value={value}
            onChange={setValue}
            theme={resolvedTheme}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <PreviewPanel content={content} renderError={renderError} />
        </TabsContent>

        <TabsContent value="split" className="mt-0">
          {isDesktop ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <EditorPanel
                value={value}
                onChange={setValue}
                theme={resolvedTheme}
              />
              <PreviewPanel content={content} renderError={renderError} />
            </div>
          ) : (
            <EditorPanel
              value={value}
              onChange={setValue}
              theme={resolvedTheme}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WriteHeaderControls({
  activeView,
  isDesktop,
  onChangeView,
  onCopy,
  onExport,
  onClear,
  saveIcon,
  saveLabel,
  wordCount,
  charCount,
}: {
  activeView: ViewMode;
  isDesktop: boolean;
  onChangeView: (value: ViewMode) => void;
  onCopy: () => void;
  onExport: () => void;
  onClear: () => void;
  saveIcon: string;
  saveLabel: string;
  wordCount: number;
  charCount: number;
}) {
  const viewOptions = (
    isDesktop
      ? (["edit", "preview", "split"] as ViewMode[])
      : (["edit", "preview"] as ViewMode[])
  ) as ViewMode[];

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
      <div className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-0.5">
        {viewOptions.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChangeView(view)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
              activeView === view
                ? "bg-[color-mix(in_srgb,var(--background)_88%,transparent)] text-foreground"
                : "text-[color-mix(in_srgb,var(--foreground)_68%,transparent)] hover:text-foreground",
            )}
          >
            <Icon
              icon={
                view === "edit"
                  ? "mingcute:edit-2-line"
                  : view === "preview"
                    ? "mingcute:eye-2-line"
                    : "mingcute:layout-grid-line"
              }
            />
            {view === "edit" ? "编辑" : view === "preview" ? "预览" : "分屏"}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {isDesktop ? (
          <>
            <HeaderActionButton
              icon="mingcute:copy-2-line"
              label="复制"
              onClick={onCopy}
            />
            <HeaderActionButton
              icon="mingcute:delete-2-line"
              label="清空"
              onClick={onClear}
            />
          </>
        ) : null}
        <HeaderActionButton
          icon="mingcute:download-2-line"
          label={isDesktop ? "导出 .mdx" : "导出"}
          onClick={onExport}
        />
      </div>

      {isDesktop ? (
        <span className="inline-flex items-center gap-1 text-xs text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
          <Icon icon={saveIcon} />
          {saveLabel} · {wordCount} 词 · {charCount} 字符
        </span>
      ) : null}
    </div>
  );
}

function HeaderActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-2 py-1 text-xs text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-foreground"
    >
      <Icon icon={icon} />
      {label}
    </button>
  );
}

function EditorPanel({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  theme: string | undefined;
}) {
  return (
    <Card className="relative h-[62vh] overflow-hidden rounded-3xl border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_94%,transparent)] p-0 shadow-[0_18px_48px_-34px_color-mix(in_srgb,var(--foreground)_35%,transparent)] backdrop-blur-xl lg:h-[calc(100vh-16rem)]">
      <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#ff5f56]" />
        <span className="size-2 rounded-full bg-[#ffbd2e]" />
        <span className="size-2 rounded-full bg-[#27c93f]" />
      </div>
      <CodeMirror
        value={value}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
        }}
        extensions={editorExtensions}
        onChange={onChange}
        theme={theme === "dark" ? atomone : vscodeLight}
        className="h-full pt-8 text-sm [&_.cm-content]:pb-16 [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:overflow-auto"
      />
    </Card>
  );
}

function PreviewPanel({
  content,
  renderError,
}: {
  content: ReactNode;
  renderError: string | null;
}) {
  return (
    <Card className="h-[62vh] overflow-auto rounded-[1.5rem] border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--background)_95%,transparent)] p-5 shadow-[0_18px_48px_-34px_color-mix(in_srgb,var(--foreground)_35%,transparent)] backdrop-blur-xl lg:h-[calc(100vh-16rem)] lg:p-8">
      {renderError ? (
        <div className="flex items-start gap-2 rounded-xl border border-[color:color-mix(in_srgb,#ff3b30_36%,transparent)] bg-[color:color-mix(in_srgb,#ff3b30_12%,transparent)] px-4 py-3 text-sm text-[color:color-mix(in_srgb,#ff3b30_80%,var(--foreground))]">
          <Icon icon="mingcute:warning-line" className="mt-0.5 shrink-0" />
          <p>{renderError}</p>
        </div>
      ) : (
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {content}
        </article>
      )}
    </Card>
  );
}
