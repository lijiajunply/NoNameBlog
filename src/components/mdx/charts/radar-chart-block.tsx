"use client";

import { useMemo } from "react";
import type { NormalizedRadarSpec } from "./spec";

type Point = { x: number; y: number };

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
): Point {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

function toPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }

  return `${points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")} Z`;
}

export function RadarChartBlock({ spec }: { spec: NormalizedRadarSpec }) {
  const axisLabels = useMemo(
    () =>
      spec.data
        .map((item) => {
          const label = item[spec.axisKey];
          return typeof label === "string" && label.trim() ? label : null;
        })
        .filter((label): label is string => label !== null),
    [spec.data, spec.axisKey],
  );

  const axisCount = axisLabels.length;
  const center = 50;
  const radius = 36;

  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of spec.data) {
      for (const line of spec.series) {
        const value = row[line.key];
        if (
          typeof value === "number" &&
          Number.isFinite(value) &&
          value > max
        ) {
          max = value;
        }
      }
    }
    return max > 0 ? max : 1;
  }, [spec.data, spec.series]);

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  const axisPoints = useMemo(() => {
    if (axisCount === 0) {
      return [];
    }

    return axisLabels.map((_, index) => {
      const angle = -Math.PI / 2 + (index / axisCount) * Math.PI * 2;
      return polarToCartesian(center, center, radius, angle);
    });
  }, [axisLabels, axisCount]);

  const linePolygons = useMemo(() => {
    if (axisCount === 0) {
      return [];
    }

    return spec.series.map((line, lineIndex) => {
      const color = line.color || `var(--chart-${(lineIndex % 5) + 1})`;
      const points = spec.data.map((row, rowIndex) => {
        const rawValue = row[line.key];
        const value =
          typeof rawValue === "number" && Number.isFinite(rawValue)
            ? rawValue
            : 0;
        const normalized = Math.max(0, Math.min(1, value / maxValue));
        const angle = -Math.PI / 2 + (rowIndex / axisCount) * Math.PI * 2;
        return polarToCartesian(center, center, radius * normalized, angle);
      });

      return {
        key: line.key,
        label: line.label || line.key,
        color,
        points,
      };
    });
  }, [spec.series, spec.data, axisCount, maxValue]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="mx-auto w-full max-w-[420px]"
        style={{ aspectRatio: "1 / 1" }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <title>{spec.title || "Radar chart"}</title>
          {gridLevels.map((level) => {
            const points = axisLabels.map((_, index) => {
              const angle = -Math.PI / 2 + (index / axisCount) * Math.PI * 2;
              return polarToCartesian(center, center, radius * level, angle);
            });

            return (
              <path
                d={toPath(points)}
                fill="none"
                key={`grid-${level}`}
                stroke="var(--chart-grid)"
                strokeWidth={0.45}
              />
            );
          })}

          {axisPoints.map((point, index) => (
            <line
              key={`axis-${axisLabels[index]}`}
              stroke="var(--chart-grid)"
              strokeWidth={0.45}
              x1={center}
              x2={point.x}
              y1={center}
              y2={point.y}
            />
          ))}

          {linePolygons.map((line) => (
            <g key={line.key}>
              <path
                d={toPath(line.points)}
                fill={line.color}
                fillOpacity={0.2}
                stroke={line.color}
                strokeWidth={0.8}
              />
              {line.points.map((point, index) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={line.color}
                  key={`${line.key}-point-${axisLabels[index]}`}
                  r={0.8}
                />
              ))}
            </g>
          ))}

          {axisPoints.map((point, index) => {
            const dx = point.x > center ? 2 : point.x < center ? -2 : 0;
            const dy = point.y > center ? 3 : point.y < center ? -1.5 : 0;
            const textAnchor =
              point.x > center + 1
                ? "start"
                : point.x < center - 1
                  ? "end"
                  : "middle";

            return (
              <text
                fill="var(--chart-label)"
                fontSize="3.2"
                key={`label-${axisLabels[index]}`}
                textAnchor={textAnchor}
                x={point.x + dx}
                y={point.y + dy}
              >
                {axisLabels[index]}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {linePolygons.map((line) => (
          <div
            className="flex items-center gap-2 rounded-md bg-black/5 px-2 py-1.5 text-xs dark:bg-white/5"
            key={`legend-${line.key}`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-neutral-700 dark:text-neutral-300">
              {line.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
