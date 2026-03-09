"use client";

import type { FeatureCollection, Geometry } from "geojson";
import {
  ChoroplethChart,
  ChoroplethFeatureComponent,
  ChoroplethTooltip,
} from "@/components/charts/choropleth";
import type { NormalizedChoroplethSpec } from "./spec";

type MapFeatureProperties = {
  id: string;
  name: string;
};

type BuiltinMap = {
  center: [number, number];
  scale: number;
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry, MapFeatureProperties>;
};

const CHINA_PROVINCES: FeatureCollection<Geometry, MapFeatureProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "guangdong", name: "广东" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [109.5, 25.0],
            [117.8, 25.0],
            [117.8, 21.0],
            [109.5, 21.0],
            [109.5, 25.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "zhejiang", name: "浙江" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [118.0, 31.0],
            [123.0, 31.0],
            [123.0, 27.0],
            [118.0, 27.0],
            [118.0, 31.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "jiangsu", name: "江苏" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [116.5, 35.5],
            [121.5, 35.5],
            [121.5, 30.5],
            [116.5, 30.5],
            [116.5, 35.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "sichuan", name: "四川" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [98.5, 33.5],
            [108.5, 33.5],
            [108.5, 26.0],
            [98.5, 26.0],
            [98.5, 33.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "beijing", name: "北京" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [115.8, 40.2],
            [116.9, 40.2],
            [116.9, 39.4],
            [115.8, 39.4],
            [115.8, 40.2],
          ],
        ],
      },
    },
  ],
};

const WORLD_REGIONS: FeatureCollection<Geometry, MapFeatureProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "north-america", name: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-170, 72],
            [-50, 72],
            [-50, 12],
            [-170, 12],
            [-170, 72],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "south-america", name: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-82, 12],
            [-34, 12],
            [-34, -56],
            [-82, -56],
            [-82, 12],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "europe", name: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-11, 71],
            [40, 71],
            [40, 35],
            [-11, 35],
            [-11, 71],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "africa", name: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-20, 35],
            [52, 35],
            [52, -35],
            [-20, -35],
            [-20, 35],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "asia", name: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [40, 78],
            [180, 78],
            [180, 5],
            [40, 5],
            [40, 78],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "oceania", name: "Oceania" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [110, -10],
            [180, -10],
            [180, -48],
            [110, -48],
            [110, -10],
          ],
        ],
      },
    },
  ],
};

const BUILTIN_MAPS: Record<string, BuiltinMap> = {
  "china-provinces": {
    center: [104, 33],
    scale: 460,
    data: CHINA_PROVINCES,
  },
  "world-countries": {
    center: [20, 18],
    scale: 130,
    data: WORLD_REGIONS,
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
  const map = BUILTIN_MAPS[spec.mapId];
  if (!map) {
    return (
      <div className="rounded-lg border border-amber-300/70 bg-amber-50/70 p-3 text-amber-900 text-sm dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-200">
        Unknown built-in map id: <code>{spec.mapId}</code>
      </div>
    );
  }

  const valueMap = new Map(
    spec.data.map((item) => [item.featureId, item.value]),
  );
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
      <ChoroplethChart
        center={map.center}
        data={map.data}
        scale={map.scale}
        zoomEnabled
      >
        <ChoroplethFeatureComponent
          getFeatureColor={(feature) => {
            const id =
              typeof feature.properties?.id === "string"
                ? feature.properties.id
                : "";
            const value = valueMap.get(id);
            if (typeof value !== "number") {
              return "var(--chart-grid)";
            }
            return (
              colors[getQuantileIndex(value, min, max, colors.length)] ||
              "var(--chart-1)"
            );
          }}
        />
        <ChoroplethTooltip
          getFeatureName={(feature) =>
            typeof feature.properties?.name === "string"
              ? feature.properties.name
              : "Unknown"
          }
          getFeatureValue={(feature) => {
            const id =
              typeof feature.properties?.id === "string"
                ? feature.properties.id
                : "";
            return valueMap.get(id);
          }}
          valueLabel="Heat"
        />
      </ChoroplethChart>

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
