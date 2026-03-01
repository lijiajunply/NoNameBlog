"use client";

import type { ScaleLinear, ScaleTime } from "d3-scale";
import type { PointerEvent } from "react";
import { useMemo, useState } from "react";
import type { LineConfig, TooltipData } from "./chart-context";

export type ChartSelection = {
  active: boolean;
  startX: number;
  endX: number;
};

type InteractionOptions = {
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  data: Record<string, unknown>[];
  lines: LineConfig[];
  xAccessor: (d: Record<string, unknown>) => Date;
  bisectDate: (
    array: Record<string, unknown>[],
    x: Date,
    lo?: number,
    hi?: number,
  ) => number;
  canInteract: boolean;
};

export function useChartInteraction({
  xScale,
  yScale,
  data,
  lines,
  xAccessor,
  bisectDate,
  canInteract,
}: InteractionOptions) {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const clearSelection = () => {
    // AreaChart currently doesn't expose range selection in this blog use case.
  };

  const selection = null;

  const interactionHandlers = useMemo(
    () => ({
      onPointerLeave: () => {
        setTooltipData(null);
      },
      onPointerMove: (event: PointerEvent<SVGGElement>) => {
        if (!canInteract || data.length === 0) {
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(localX, rect.width));
        const hoveredDate = xScale.invert(clampedX);

        let index = bisectDate(data, hoveredDate);
        if (index >= data.length) {
          index = data.length - 1;
        }

        const previous = data[index - 1];
        const current = data[index];

        const currentDate = current
          ? xAccessor(current).getTime()
          : Number.POSITIVE_INFINITY;
        const previousDate = previous
          ? xAccessor(previous).getTime()
          : Number.NEGATIVE_INFINITY;
        const targetTime = hoveredDate.getTime();

        if (
          previous &&
          Math.abs(targetTime - previousDate) <
            Math.abs(currentDate - targetTime)
        ) {
          index -= 1;
        }

        const point = data[index];
        if (!point) {
          return;
        }

        const x = xScale(xAccessor(point)) ?? 0;
        const yPositions = Object.fromEntries(
          lines.map((line) => {
            const raw = point[line.dataKey];
            const numeric = typeof raw === "number" ? raw : 0;
            return [line.dataKey, yScale(numeric) ?? 0];
          }),
        );

        setTooltipData({
          point,
          index,
          x,
          yPositions,
        });
      },
    }),
    [canInteract, data, xScale, bisectDate, xAccessor, lines, yScale],
  );

  return {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle: {
      cursor: "crosshair",
      touchAction: "none",
    } as const,
  };
}
