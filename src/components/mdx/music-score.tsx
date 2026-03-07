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
  const visualObjRef = useRef<unknown>(null);
  const tuneReadyRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        visualObjRef.current = visualObjects[0] ?? null;
        tuneReadyRef.current = false;

        const supportsAudio = abcjs.synth.supportsAudio();
        setHasAudio(supportsAudio);

        if (!supportsAudio || !visualObjects[0]) {
          return;
        }

        const synthController = new abcjs.synth.SynthController();
        synthController.load(controlsRef.current, null, {
          displayLoop: true,
          displayRestart: true,
          displayPlay: true,
          displayProgress: true,
          displayWarp: true,
        });
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
      visualObjRef.current = null;
      tuneReadyRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
    };
  }, [score, resolvedTheme]);

  const togglePlay = async () => {
    if (!synthControllerRef.current || !visualObjRef.current) {
      return;
    }

    const synthController = synthControllerRef.current;

    if (isPlaying) {
      synthController.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      if (!tuneReadyRef.current) {
        await synthController.setTune(visualObjRef.current, true);
        tuneReadyRef.current = true;
      }

      synthController.play();
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "播放失败");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <figure
      className={cn(
        "my-6 rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/50",
        props.className,
      )}
    >
      <div
        ref={notationRef}
        className="overflow-x-auto rounded-lg border border-neutral-200/70 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void togglePlay();
          }}
          disabled={!hasAudio || isLoading}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {isLoading ? "准备中..." : isPlaying ? "暂停" : "播放"}
        </button>
        {!hasAudio ? (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            当前环境不支持音频播放
          </span>
        ) : null}
      </div>

      <div ref={controlsRef} className="abcjs-controls mt-3 overflow-x-auto" />

      {error ? (
        <pre className="mt-3 overflow-x-auto rounded-md border border-red-200/70 bg-red-50/80 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          <code>{error}</code>
        </pre>
      ) : null}
    </figure>
  );
}
