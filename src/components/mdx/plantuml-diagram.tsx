import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PlantUMLDiagramProps = {
  code?: string;
  children?: ReactNode;
  className?: string;
};

function normalizeCodeInput(input: PlantUMLDiagramProps): string {
  if (typeof input.code === "string") {
    return input.code.trim();
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

function encodePlantUmlHex(source: string): string {
  const bytes = new TextEncoder().encode(source);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function PlantUMLDiagram(props: PlantUMLDiagramProps) {
  const code = normalizeCodeInput(props);

  if (!code) {
    return (
      <figure
        className={cn(
          "my-8 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200",
          props.className,
        )}
      >
        <figcaption className="font-medium">PlantUML 内容为空</figcaption>
      </figure>
    );
  }

  const diagramUrl = `https://www.plantuml.com/plantuml/svg/~h${encodePlantUmlHex(code)}`;

  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-[28px] border border-neutral-200/80",
        props.className,
      )}
    >
      <div className="overflow-x-auto px-4 py-5">
        <img
          alt="PlantUML diagram"
          className="mx-auto h-auto min-w-[320px] max-w-full rounded-2xl "
          decoding="async"
          loading="lazy"
          src={diagramUrl}
        />
      </div>
    </figure>
  );
}
