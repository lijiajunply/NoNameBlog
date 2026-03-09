"use client";

import type { FeatureCollection, Geometry } from "geojson";
import cnAtlas from "cn-atlas/cn-atlas.json";
import countries110m from "world-atlas/countries-110m.json";
import { feature as topojsonFeature } from "topojson-client";
import {
  ChoroplethChart,
  ChoroplethFeatureComponent,
  ChoroplethTooltip,
} from "@/components/charts/choropleth";
import { CHOROPLETH_VIVID_SCALE } from "@/config/chart-palette";
import type { NormalizedChoroplethSpec } from "./spec";

type MapFeatureProperties = {
  id: string;
  name: string;
  aliases?: string[];
};

type BuiltinMap = {
  center: [number, number];
  scale: number;
  data: FeatureCollection<Geometry, MapFeatureProperties>;
};

type TopologyLike = {
  objects: Record<string, unknown>;
};

function normalizeFeatureKey(value: string): string {
  return value.trim().toLowerCase();
}

function buildWorldCountriesFromTopojson(): FeatureCollection<
  Geometry,
  MapFeatureProperties
> {
  const topology = countries110m as unknown as TopologyLike;
  const countriesObject = topology.objects.countries;

  const collection = topojsonFeature(
    topology as never,
    countriesObject as never,
  ) as unknown as FeatureCollection<Geometry | null, { name?: string }>;

  return {
    type: "FeatureCollection",
    features: collection.features
      .filter((feature) => feature.geometry !== null)
      .map((feature, index) => {
        const rawId =
          typeof feature.id === "string" || typeof feature.id === "number"
            ? String(feature.id)
            : undefined;

        const name =
          typeof feature.properties?.name === "string" &&
          feature.properties.name.trim().length > 0
            ? feature.properties.name
            : `Country ${index + 1}`;

        return {
          ...feature,
          geometry: feature.geometry as Geometry,
          properties: {
            id: rawId && rawId.length > 0 ? rawId : normalizeFeatureKey(name),
            name,
            aliases: rawId ? [rawId, name] : [name],
          },
        };
      }),
  };
}

const CHINA_PROVINCES_FALLBACK: FeatureCollection<
  Geometry,
  MapFeatureProperties
> = {
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

function buildChinaProvincesFromTopojson(): FeatureCollection<
  Geometry,
  MapFeatureProperties
> {
  try {
    const topology = cnAtlas as unknown as TopologyLike;
    const provincesObject = topology.objects.provinces;

    const collection = topojsonFeature(
      topology as never,
      provincesObject as never,
    ) as unknown as FeatureCollection<
      Geometry | null,
      {
        id?: string | number;
        name?: string;
        地名?: string;
        区划码?: string | number;
      }
    >;

    return {
      type: "FeatureCollection",
      features: collection.features
        .filter((feature) => feature.geometry !== null)
        .map((feature, index) => {
          const code = (() => {
            const rawCode =
              feature.properties?.id ??
              feature.properties?.区划码 ??
              feature.id;
            if (typeof rawCode === "string" || typeof rawCode === "number") {
              return String(rawCode);
            }
            return "";
          })();

          const englishName =
            typeof feature.properties?.name === "string" &&
            feature.properties.name.trim().length > 0
              ? feature.properties.name
              : "";

          const chineseName =
            typeof feature.properties?.地名 === "string" &&
            feature.properties.地名.trim().length > 0
              ? feature.properties.地名
              : "";

          const id = (() => {
            if (englishName) {
              return normalizeFeatureKey(englishName);
            }
            if (code) {
              return code;
            }
            return `china-province-${index + 1}`;
          })();

          const name = chineseName || englishName || `省份 ${index + 1}`;

          const aliases = [id, code, englishName, chineseName].filter(
            (value): value is string => value.length > 0,
          );

          return {
            ...feature,
            geometry: feature.geometry as Geometry,
            properties: {
              id,
              name,
              aliases,
            },
          };
        }),
    };
  } catch {
    return CHINA_PROVINCES_FALLBACK;
  }
}

const CHINA_PROVINCES = buildChinaProvincesFromTopojson();
const WORLD_COUNTRIES = buildWorldCountriesFromTopojson();

const BUILTIN_MAPS: Record<string, BuiltinMap> = {
  "china-provinces": {
    center: [104, 33],
    scale: 460,
    data: CHINA_PROVINCES,
  },
  "world-countries": {
    center: [20, 18],
    scale: 130,
    data: WORLD_COUNTRIES,
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

function getFeatureIdCandidates(feature: {
  properties?: { id?: string | number; name?: string; aliases?: string[] };
}): string[] {
  const rawId =
    typeof feature.properties?.id === "string" ||
    typeof feature.properties?.id === "number"
      ? String(feature.properties.id)
      : "";
  const name =
    typeof feature.properties?.name === "string" ? feature.properties.name : "";

  const candidates = new Set<string>();

  if (rawId.length > 0) {
    candidates.add(rawId);
    candidates.add(normalizeFeatureKey(rawId));

    const withoutLeadingZeros = rawId.replace(/^0+/, "");
    if (withoutLeadingZeros.length > 0) {
      candidates.add(withoutLeadingZeros);
      candidates.add(normalizeFeatureKey(withoutLeadingZeros));
    }
  }

  if (name.length > 0) {
    candidates.add(name);
    candidates.add(normalizeFeatureKey(name));
  }

  if (Array.isArray(feature.properties?.aliases)) {
    for (const alias of feature.properties.aliases) {
      if (typeof alias !== "string" || alias.length === 0) {
        continue;
      }
      candidates.add(alias);
      candidates.add(normalizeFeatureKey(alias));
    }
  }

  return Array.from(candidates);
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

  const rawValueMap = new Map(
    spec.data.map((item) => [item.featureId, item.value]),
  );
  const normalizedValueMap = new Map(
    spec.data.map((item) => [normalizeFeatureKey(item.featureId), item.value]),
  );

  const getValueByFeature = (feature: {
    properties?: { id?: string | number; name?: string; aliases?: string[] };
  }) => {
    for (const candidate of getFeatureIdCandidates(feature)) {
      const rawValue = rawValueMap.get(candidate);
      if (typeof rawValue === "number") {
        return rawValue;
      }

      const normalizedValue = normalizedValueMap.get(
        normalizeFeatureKey(candidate),
      );
      if (typeof normalizedValue === "number") {
        return normalizedValue;
      }
    }

    return undefined;
  };

  const values = spec.data.map((item) => item.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  const colors = CHOROPLETH_VIVID_SCALE;
  const isChinaProvinceMap = spec.mapId === "china-provinces";

  return (
    <div className="space-y-3">
      <ChoroplethChart
        center={map.center}
        data={map.data}
        scale={map.scale}
        zoomEnabled
      >
        <ChoroplethFeatureComponent
          animated={!isChinaProvinceMap}
          fadedOpacity={isChinaProvinceMap ? 0.85 : 0.4}
          hoverEffect={isChinaProvinceMap ? "none" : "full"}
          getFeatureColor={(feature) => {
            const value = getValueByFeature(feature);
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
          getFeatureValue={(feature) => getValueByFeature(feature)}
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
