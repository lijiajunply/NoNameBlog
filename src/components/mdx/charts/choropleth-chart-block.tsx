"use client";

import { useMemo } from "react";
import type { NormalizedChoroplethSpec } from "./spec";

type BuiltinFeature = {
  id: string;
  name: string;
  path: string;
};

type BuiltinMap = {
  title: string;
  viewBox: string;
  features: BuiltinFeature[];
};

const BUILTIN_MAPS: Record<string, BuiltinMap> = {
  "china-provinces": {
    title: "China Provinces (Simplified)",
    viewBox: "0 0 100 70",
    features: [
      {
        id: "xinjiang",
        name: "新疆",
        path: "M4 18 L18 12 L22 22 L10 30 L4 24 Z",
      },
      {
        id: "xizang",
        name: "西藏",
        path: "M16 34 L30 30 L34 40 L20 46 L14 40 Z",
      },
      { id: "qinghai", name: "青海", path: "M22 18 L34 16 L36 28 L24 30 Z" },
      {
        id: "gansu",
        name: "甘肃",
        path: "M34 16 L42 14 L46 22 L40 30 L36 28 Z",
      },
      {
        id: "neimenggu",
        name: "内蒙古",
        path: "M42 12 L66 8 L70 16 L52 20 L46 22 Z",
      },
      {
        id: "sichuan",
        name: "四川",
        path: "M36 30 L48 28 L50 36 L40 42 L34 38 Z",
      },
      {
        id: "yunnan",
        name: "云南",
        path: "M34 42 L44 40 L46 50 L36 54 L30 48 Z",
      },
      {
        id: "guangxi",
        name: "广西",
        path: "M48 48 L56 46 L58 54 L50 58 L46 52 Z",
      },
      {
        id: "guangdong",
        name: "广东",
        path: "M58 48 L66 46 L68 54 L60 58 L56 52 Z",
      },
      {
        id: "hunan",
        name: "湖南",
        path: "M54 40 L62 38 L64 46 L56 48 L52 44 Z",
      },
      {
        id: "hubei",
        name: "湖北",
        path: "M54 32 L62 30 L64 38 L56 40 L52 36 Z",
      },
      {
        id: "henan",
        name: "河南",
        path: "M56 24 L64 22 L66 30 L58 32 L54 28 Z",
      },
      {
        id: "hebei",
        name: "河北",
        path: "M62 18 L70 16 L72 24 L64 24 L60 20 Z",
      },
      { id: "beijing", name: "北京", path: "M70 18 L72 18 L72 20 L70 20 Z" },
      { id: "shandong", name: "山东", path: "M68 24 L76 24 L78 30 L70 30 Z" },
      { id: "jiangsu", name: "江苏", path: "M68 32 L76 32 L76 38 L68 38 Z" },
      { id: "zhejiang", name: "浙江", path: "M70 38 L76 38 L78 44 L72 46 Z" },
      { id: "fujian", name: "福建", path: "M66 44 L72 46 L72 52 L66 52 Z" },
    ],
  },
  "world-countries": {
    title: "World Regions (Simplified)",
    viewBox: "0 0 120 70",
    features: [
      {
        id: "north-america",
        name: "North America",
        path: "M4 8 L28 6 L34 16 L26 24 L10 22 L4 14 Z",
      },
      {
        id: "south-america",
        name: "South America",
        path: "M24 28 L34 30 L36 44 L30 60 L22 56 L20 40 Z",
      },
      {
        id: "europe",
        name: "Europe",
        path: "M56 10 L68 10 L70 18 L60 20 L54 16 Z",
      },
      {
        id: "africa",
        name: "Africa",
        path: "M58 22 L70 24 L72 44 L64 58 L56 50 L54 34 Z",
      },
      {
        id: "middle-east",
        name: "Middle East",
        path: "M72 20 L82 20 L84 28 L74 30 Z",
      },
      {
        id: "asia",
        name: "Asia",
        path: "M72 10 L110 8 L114 24 L96 34 L82 30 L78 20 Z",
      },
      {
        id: "oceania",
        name: "Oceania",
        path: "M96 42 L112 44 L110 56 L94 54 Z",
      },
    ],
  },
};

function getQuantileIndex(
  value: number,
  min: number,
  max: number,
  steps: number,
): number {
  if (max <= min) {
    return 0;
  }
  const normalized = (value - min) / (max - min);
  const index = Math.floor(normalized * steps);
  return Math.min(Math.max(index, 0), steps - 1);
}

export function ChoroplethChartBlock({
  spec,
}: {
  spec: NormalizedChoroplethSpec;
}) {
  const valueMap = useMemo(
    () => new Map(spec.data.map((item) => [item.featureId, item.value])),
    [spec.data],
  );
  const map = BUILTIN_MAPS[spec.mapId];

  if (!map) {
    return (
      <div className="rounded-lg border border-amber-300/70 bg-amber-50/70 p-3 text-amber-900 text-sm dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-200">
        Unknown built-in map id: <code>{spec.mapId}</code>
      </div>
    );
  }

  const values = spec.data.map((item) => item.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  const colors = [
    "color-mix(in srgb, var(--chart-1) 20%, white)",
    "color-mix(in srgb, var(--chart-1) 35%, white)",
    "color-mix(in srgb, var(--chart-1) 50%, white)",
    "color-mix(in srgb, var(--chart-1) 70%, white)",
    "var(--chart-1)",
  ];

  return (
    <div className="space-y-3">
      <svg
        aria-label={spec.title || map.title}
        className="h-auto w-full"
        role="img"
        viewBox={map.viewBox}
      >
        <title>{spec.title || map.title}</title>
        {map.features.map((feature) => {
          const value = valueMap.get(feature.id);
          const color =
            typeof value === "number"
              ? colors[getQuantileIndex(value, min, max, colors.length)]
              : "var(--chart-grid)";

          return (
            <path
              d={feature.path}
              fill={color}
              key={feature.id}
              stroke="var(--chart-background)"
              strokeWidth={0.7}
            >
              <title>
                {feature.name}
                {typeof value === "number"
                  ? `: ${value.toLocaleString()}`
                  : ": no data"}
              </title>
            </path>
          );
        })}
      </svg>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-600 dark:text-neutral-400">Low</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full">
          {colors.map((color) => (
            <span
              className="flex-1"
              key={color}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-neutral-600 dark:text-neutral-400">High</span>
      </div>
    </div>
  );
}
