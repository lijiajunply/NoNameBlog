"use client";

import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AbcJsLike = {
  renderAbc: (
    element: HTMLElement | string,
    abc: string,
    options?: Record<string, unknown>,
  ) => unknown[];
  synth: {
    SynthController: new () => {
      load: (
        el: HTMLElement,
        cursorControl: unknown,
        options: Record<string, unknown>,
      ) => void;
      disable: (shouldDisable: boolean) => void;
      setTune: (
        visualObj: unknown,
        userAction: boolean,
        audioParams?: Record<string, unknown>,
      ) => Promise<unknown>;
      play: () => void;
      pause: () => void;
    };
    supportsAudio: () => boolean;
  };
};

type MusicScoreProps = {
  score?: string;
  children?: ReactNode;
  className?: string;
};

function normalizeScoreInput(input: MusicScoreProps): string {
  if (typeof input.score === "string") {
    return input.score.trim();
  }

  if (typeof input.children === "string") {
    return input.children.trim();
  }

  if (Array.isArray(input.children)) {
    return input.children
      .map((part) => (typeof part === "string" ? part : ""))
      .join("")
      .trim();
  }

  return "";
}

export function MusicScore(props: MusicScoreProps) {
  const score = useMemo(() => normalizeScoreInput(props), [props]);
  const { resolvedTheme } = useTheme();
  const notationRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const synthControllerRef = useRef<InstanceType<
    AbcJsLike["synth"]["SynthController"]
  > | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!score) {
        setError("乐谱内容为空");
        setHasAudio(false);
        return;
      }

      if (!notationRef.current || !controlsRef.current) {
        return;
      }

      try {
        setError("");
        controlsRef.current.innerHTML = "";
        notationRef.current.innerHTML = "";

        const abcjsModule = (await import("abcjs")) as unknown as {
          default?: AbcJsLike;
        } & AbcJsLike;
        const abcjs = abcjsModule.default ?? abcjsModule;

        const visualObjects = abcjs.renderAbc(notationRef.current, score, {
          responsive: "resize",
          add_classes: true,
          foregroundColor: resolvedTheme === "dark" ? "#f5f5f5" : "#171717",
        });

        const supportsAudio = abcjs.synth.supportsAudio();
        setHasAudio(supportsAudio);

        if (!supportsAudio || !visualObjects[0]) {
          return;
        }

        const synthController = new abcjs.synth.SynthController();
        synthController.load(controlsRef.current, null, {
          displayLoop: true,
          displayRestart: true,
          displayProgress: true,
          displayWarp: true,
        });
        await synthController.setTune(visualObjects[0], false);
        synthController.disable(false);
        synthControllerRef.current = synthController;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "乐谱渲染失败");
          setHasAudio(false);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      synthControllerRef.current?.pause();
      synthControllerRef.current?.disable(true);
      synthControllerRef.current = null;
    };
  }, [score, resolvedTheme]);

  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white/95 via-neutral-50/90 to-neutral-100/80 p-0 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:from-neutral-900/80 dark:via-neutral-900/70 dark:to-neutral-950/80",
        props.className,
      )}
    >
      <div className="flex items-center justify-between border-b border-neutral-200/80 px-5 py-3 dark:border-neutral-800">
        <figcaption className="text-sm font-medium tracking-wide text-neutral-700 dark:text-neutral-200">
          乐谱
        </figcaption>
        <span className="rounded-full border border-neutral-300/80 bg-white/80 px-2 py-0.5 text-[11px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-300">
          ABC Notation
        </span>
      </div>

      <div
        ref={notationRef}
        className="overflow-x-auto bg-white/80 px-4 py-4 dark:bg-neutral-950/60"
      />

      <div className="border-t border-neutral-200/80 bg-white/70 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/50">
        {!hasAudio ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            当前环境不支持音频播放
          </p>
        ) : null}
        <div ref={controlsRef} className="abcjs-controls overflow-x-auto" />
      </div>

      {error ? (
        <pre className="mx-4 mb-4 overflow-x-auto rounded-lg border border-red-200/70 bg-red-50/80 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          <code>{error}</code>
        </pre>
      ) : null}
    </figure>
  );
}
