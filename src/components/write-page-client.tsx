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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
const STORAGE_KEY_PREFIX = "mdx-editor-content";
const ACTIVE_FILE_STORAGE_KEY = "mdx-editor-active-file";
const DEV_FILE_SYSTEM_ENABLED = process.env.NODE_ENV === "development";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ViewMode = "edit" | "preview" | "split";
type FileSaveStatus = "idle" | "saving" | "saved" | "error";

type LocalPermissionDescriptor = {
  mode?: "read" | "readwrite";
};

type LocalWritableFileStream = {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
};

type LocalFileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<LocalWritableFileStream>;
  requestPermission?: (
    descriptor?: LocalPermissionDescriptor,
  ) => Promise<PermissionState>;
};

type LocalDirectoryHandle = {
  kind: "directory";
  name: string;
  values: () => AsyncIterable<LocalDirectoryHandle | LocalFileHandle>;
};

type EditablePostFile = {
  id: string;
  name: string;
  relativePath: string;
  handle: LocalFileHandle;
};

type WindowWithDirectoryPicker = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: {
      mode?: "read" | "readwrite";
    }) => Promise<LocalDirectoryHandle>;
  };

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

function getDraftStorageKey(fileId: string | null) {
  return `${STORAGE_KEY_PREFIX}:${fileId ?? "__scratch__"}`;
}

async function collectEditablePostFiles(
  directoryHandle: LocalDirectoryHandle,
  parentPath = "",
): Promise<EditablePostFile[]> {
  const files: EditablePostFile[] = [];

  for await (const entry of directoryHandle.values()) {
    const relativePath = parentPath
      ? `${parentPath}/${entry.name}`
      : entry.name;

    if (entry.kind === "directory") {
      files.push(...(await collectEditablePostFiles(entry, relativePath)));
      continue;
    }

    if (entry.name.endsWith(".mdx")) {
      files.push({
        id: relativePath,
        name: entry.name,
        relativePath,
        handle: entry,
      });
    }
  }

  return files.toSorted((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function WritePageClient() {
  const { resolvedTheme } = useTheme();
  const { setHeaderContent, clearHeaderContent } = useHeaderSlotContext();
  const [value, setValue] = useState(initialSource);
  const [content, setContent] = useState<ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fileSaveStatus, setFileSaveStatus] = useState<FileSaveStatus>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("edit");
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileSourceValue, setFileSourceValue] = useState<string | null>(null);
  const [postFiles, setPostFiles] = useState<EditablePostFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [directoryLabel, setDirectoryLabel] = useState<string | null>(null);
  const [fileAccessError, setFileAccessError] = useState<string | null>(null);
  const [isFileSystemSupported, setIsFileSystemSupported] = useState(false);
  const isInitialMount = useRef(true);
  const hasInitializedView = useRef(false);
  const taskIdRef = useRef(0);
  const preferredFileIdRef = useRef<string | null>(null);

  const selectedPostFile = useMemo(
    () => postFiles.find((file) => file.id === selectedFileId) ?? null,
    [postFiles, selectedFileId],
  );
  const hasSelectedFile = selectedPostFile !== null;
  const hasUnsavedFileChanges =
    hasSelectedFile && fileSourceValue !== null && value !== fileSourceValue;

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
    const activeFileId = localStorage.getItem(ACTIVE_FILE_STORAGE_KEY);
    const draft = localStorage.getItem(
      getDraftStorageKey(activeFileId || null),
    );

    preferredFileIdRef.current = activeFileId;
    setValue(draft || initialSource);
    setSelectedFileId(activeFileId || null);
    setIsFileSystemSupported(
      typeof (window as WindowWithDirectoryPicker).showDirectoryPicker ===
        "function",
    );
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
        localStorage.setItem(getDraftStorageKey(selectedFileId), value);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, selectedFileId]);

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
      localStorage.removeItem(getDraftStorageKey(selectedFileId));
      setSaveStatus("idle");
      setFileSaveStatus("idle");
      setActionMessage("内容已清空");
    }
  }, [selectedFileId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setActionMessage("已复制到剪贴板");
    } catch {
      setActionMessage("复制失败，请检查浏览器权限");
    }
  }, [value]);

  const handleConnectDirectory = useCallback(async () => {
    const windowWithPicker = window as WindowWithDirectoryPicker;
    if (!windowWithPicker.showDirectoryPicker) {
      setFileAccessError(
        "当前浏览器不支持目录读写，请改用 Chromium 内核浏览器。",
      );
      return;
    }

    try {
      setIsLoadingFiles(true);
      setFileAccessError(null);
      const directoryHandle = await windowWithPicker.showDirectoryPicker({
        mode: "readwrite",
      });
      const files = await collectEditablePostFiles(directoryHandle);

      setPostFiles(files);
      setDirectoryLabel(directoryHandle.name);
      setActionMessage(
        files.length
          ? `已连接 ${directoryHandle.name}，找到 ${files.length} 个 MDX 文件`
          : `已连接 ${directoryHandle.name}，但还没有找到 MDX 文件`,
      );

      if (!files.length) {
        return;
      }

      const preferredFileId = preferredFileIdRef.current;
      if (
        preferredFileId &&
        files.some((file) => file.id === preferredFileId)
      ) {
        const draftSource = localStorage.getItem(
          getDraftStorageKey(preferredFileId),
        );
        const matchedFile = files.find((file) => file.id === preferredFileId);

        if (matchedFile) {
          const diskSource = await (await matchedFile.handle.getFile()).text();
          setSelectedFileId(matchedFile.id);
          setFileSourceValue(diskSource);
          setFileSaveStatus("idle");
          setValue(draftSource ?? diskSource);
        }
      } else {
        setSelectedFileId(null);
        setFileSourceValue(null);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setFileAccessError(
        error instanceof Error ? error.message : "连接目录失败，请重试。",
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  const handleSaveToFile = useCallback(async () => {
    if (!selectedPostFile) {
      return;
    }

    try {
      setFileSaveStatus("saving");
      setFileAccessError(null);
      const permission = await selectedPostFile.handle.requestPermission?.({
        mode: "readwrite",
      });

      if (permission === "denied") {
        throw new Error("目录写入权限被拒绝，无法保存文件。");
      }

      const writable = await selectedPostFile.handle.createWritable();
      await writable.write(value);
      await writable.close();

      setFileSourceValue(value);
      setFileSaveStatus("saved");
      setActionMessage(`已保存到 ${selectedPostFile.relativePath}`);
    } catch (error) {
      setFileSaveStatus("error");
      setFileAccessError(
        error instanceof Error ? error.message : "保存文件失败，请重试。",
      );
    }
  }, [selectedPostFile, value]);

  const handleSelectFile = useCallback(
    async (fileId: string) => {
      if (fileId === selectedFileId) {
        return;
      }

      if (
        hasUnsavedFileChanges &&
        !window.confirm("当前文件还有未写回磁盘的内容，确定切换吗？")
      ) {
        return;
      }

      const nextFile = postFiles.find((file) => file.id === fileId);
      if (!nextFile) {
        return;
      }

      try {
        setFileAccessError(null);
        const diskSource = await (await nextFile.handle.getFile()).text();
        const localDraft = localStorage.getItem(
          getDraftStorageKey(nextFile.id),
        );
        const nextValue = localDraft ?? diskSource;

        setSelectedFileId(nextFile.id);
        setFileSourceValue(diskSource);
        setFileSaveStatus("idle");
        setValue(nextValue);
        preferredFileIdRef.current = nextFile.id;
        localStorage.setItem(ACTIVE_FILE_STORAGE_KEY, nextFile.id);
        setActionMessage(
          localDraft && localDraft !== diskSource
            ? `已打开 ${nextFile.relativePath}，并恢复本地草稿`
            : `已打开 ${nextFile.relativePath}`,
        );
      } catch (error) {
        setFileAccessError(
          error instanceof Error ? error.message : "读取文件失败，请重试。",
        );
      }
    },
    [hasUnsavedFileChanges, postFiles, selectedFileId],
  );

  const headerContent = useMemo(
    () => (
      <WriteHeaderControls
        activeView={activeView}
        devFileActions={
          DEV_FILE_SYSTEM_ENABLED ? (
            <DevHeaderFileActions
              files={postFiles}
              fileCount={postFiles.length}
              fileSaveStatus={fileSaveStatus}
              hasSelectedFile={hasSelectedFile}
              hasUnsavedFileChanges={hasUnsavedFileChanges}
              isFileSystemSupported={isFileSystemSupported}
              isLoadingFiles={isLoadingFiles}
              onConnectDirectory={handleConnectDirectory}
              onSaveToFile={handleSaveToFile}
              onSelectFile={handleSelectFile}
              selectedFileId={selectedFileId}
              selectedFileLabel={
                selectedPostFile
                  ? `content/posts/${selectedPostFile.relativePath}`
                  : null
              }
            />
          ) : null
        }
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
      handleConnectDirectory,
      handleSaveToFile,
      handleSelectFile,
      postFiles,
      fileSaveStatus,
      hasSelectedFile,
      hasUnsavedFileChanges,
      isFileSystemSupported,
      isLoadingFiles,
      selectedFileId,
      selectedPostFile,
    ],
  );

  useEffect(() => {
    setHeaderContent(headerContent);

    return () => {
      clearHeaderContent();
    };
  }, [headerContent, setHeaderContent, clearHeaderContent]);

  return (
    <div className="relative flex flex-col h-full">
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
            activeView={activeView}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <PreviewPanel
            content={content}
            renderError={renderError}
            activeView={activeView}
          />
        </TabsContent>

        <TabsContent value="split" className="mt-0">
          {isDesktop ? (
            <ResizablePanelGroup
              orientation="horizontal"
              className="min-h-[calc(100vh-16rem)]"
            >
              <ResizablePanel defaultSize={"50%"} minSize={"36%"}>
                <EditorPanel
                  value={value}
                  onChange={setValue}
                  theme={resolvedTheme}
                  activeView={activeView}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={"50%"} minSize={"36%"}>
                <PreviewPanel
                  content={content}
                  renderError={renderError}
                  activeView={activeView}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <EditorPanel
              value={value}
              onChange={setValue}
              theme={resolvedTheme}
              activeView={activeView}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DevHeaderFileActions({
  fileCount,
  fileSaveStatus,
  files,
  hasSelectedFile,
  hasUnsavedFileChanges,
  isFileSystemSupported,
  isLoadingFiles,
  onConnectDirectory,
  onSaveToFile,
  onSelectFile,
  selectedFileId,
  selectedFileLabel,
}: {
  fileCount: number;
  fileSaveStatus: FileSaveStatus;
  files: EditablePostFile[];
  hasSelectedFile: boolean;
  hasUnsavedFileChanges: boolean;
  isFileSystemSupported: boolean;
  isLoadingFiles: boolean;
  onConnectDirectory: () => Promise<void>;
  onSaveToFile: () => Promise<void>;
  onSelectFile: (fileId: string) => Promise<void>;
  selectedFileId: string | null;
  selectedFileLabel: string | null;
}) {
  const saveButtonLabel = !hasSelectedFile
    ? "先选文件"
    : fileSaveStatus === "saving"
      ? "保存中"
      : hasUnsavedFileChanges
        ? "保存文件"
        : "已同步";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => {
          void onConnectDirectory();
        }}
        disabled={!isFileSystemSupported || isLoadingFiles}
      >
        <Icon
          icon={
            isLoadingFiles
              ? "mingcute:loading-3-line"
              : "mingcute:folder-open-line"
          }
          className={isLoadingFiles ? "animate-spin" : undefined}
        />
        连接 posts
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-w-56 rounded-full"
            disabled={!files.length}
          >
            <span className="truncate">{selectedFileLabel ?? "选择文章"}</span>
            <Icon icon="ph:caret-down-bold" className="h-3.5 w-3.5 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[20rem]">
          <DropdownMenuLabel>
            {fileCount ? `共 ${fileCount} 个 MDX 文件` : "暂无可选文件"}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedFileId ?? ""}
            onValueChange={(nextValue) => {
              void onSelectFile(nextValue);
            }}
          >
            {files.map((file) => (
              <DropdownMenuRadioItem key={file.id} value={file.id}>
                {file.relativePath}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={() => {
          void onSaveToFile();
        }}
        disabled={!hasSelectedFile || fileSaveStatus === "saving"}
      >
        <Icon
          icon={
            fileSaveStatus === "saving"
              ? "mingcute:loading-3-line"
              : fileSaveStatus === "error"
                ? "mingcute:warning-line"
                : hasUnsavedFileChanges
                  ? "mingcute:save-line"
                  : "mingcute:check-line"
          }
          className={fileSaveStatus === "saving" ? "animate-spin" : undefined}
        />
        {saveButtonLabel}
      </Button>
    </div>
  );
}

function WriteHeaderControls({
  activeView,
  devFileActions,
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
  devFileActions?: ReactNode;
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
      {devFileActions}

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
      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-2 py-1 text-xs text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-foreground"
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
  activeView,
}: {
  value: string;
  onChange: (value: string) => void;
  theme: string | undefined;
  activeView: ViewMode;
}) {
  return (
    <Card
      className={`relative h-[62vh] overflow-hidden ${activeView === "split" ? "rounded-l-3xl! rounded-r-none" : "rounded-3xl"} border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_94%,transparent)] p-0 shadow-[0_18px_48px_-34px_color-mix(in_srgb,var(--foreground)_35%,transparent)] backdrop-blur-xl lg:h-[calc(100vh-16rem)]`}
    >
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
        className="h-full text-sm [&_.cm-content]:pb-16 [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:overflow-auto"
      />
    </Card>
  );
}

function PreviewPanel({
  content,
  renderError,
  activeView,
}: {
  content: ReactNode;
  renderError: string | null;
  activeView: ViewMode;
}) {
  return (
    <Card
      className={`h-[62vh] overflow-auto ${activeView === "split" ? "rounded-r-3xl rounded-l-none" : "rounded-3xl"} border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_95%,transparent)] p-5 shadow-[0_18px_48px_-34px_color-mix(in_srgb,var(--foreground)_35%,transparent)] backdrop-blur-xl lg:h-[calc(100vh-16rem)] lg:p-8`}
    >
      {renderError ? (
        <div className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,#ff3b30_36%,transparent)] bg-[color-mix(in_srgb,#ff3b30_12%,transparent)] px-4 py-3 text-sm text-[color-mix(in_srgb,#ff3b30_80%,var(--foreground))]">
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
