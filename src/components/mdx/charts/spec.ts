export type ChartType =
  | "area"
  | "pie"
  | "radar"
  | "funnel"
  | "sankey"
  | "choropleth";

type ChartSeriesSpec = {
  key: string;
  label?: string;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
};

type PieDataPoint = {
  name: string;
  value: number;
  color?: string;
};

type FunnelDataPoint = {
  stage: string;
  value: number;
};

type SankeyNode = {
  id: string;
  label?: string;
};

type SankeyLink = {
  source: string;
  target: string;
  value: number;
};

type ChoroplethDataPoint = {
  featureId: string;
  value: number;
};

type NormalizedBaseSpec = {
  type: ChartType;
  title?: string;
  className?: string;
  aspectRatio: string;
};

export type NormalizedAreaSpec = NormalizedBaseSpec & {
  type: "area";
  xKey: string;
  series: ChartSeriesSpec[];
  data: Record<string, unknown>[];
  xAxisTicks: number;
};

export type NormalizedPieSpec = NormalizedBaseSpec & {
  type: "pie";
  data: PieDataPoint[];
  nameKey: string;
  valueKey: string;
};

export type NormalizedRadarSpec = NormalizedBaseSpec & {
  type: "radar";
  data: Record<string, unknown>[];
  axisKey: string;
  series: ChartSeriesSpec[];
};

export type NormalizedFunnelSpec = NormalizedBaseSpec & {
  type: "funnel";
  data: FunnelDataPoint[];
};

export type NormalizedSankeySpec = NormalizedBaseSpec & {
  type: "sankey";
  nodes: SankeyNode[];
  links: SankeyLink[];
};

export type NormalizedChoroplethSpec = NormalizedBaseSpec & {
  type: "choropleth";
  mapId: string;
  data: ChoroplethDataPoint[];
};

export type NormalizedChartSpec =
  | NormalizedAreaSpec
  | NormalizedPieSpec
  | NormalizedRadarSpec
  | NormalizedFunnelSpec
  | NormalizedSankeySpec
  | NormalizedChoroplethSpec;

export type ParseChartResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

export type NormalizeChartResult =
  | { ok: true; value: NormalizedChartSpec }
  | { ok: false; error: string };

const DEFAULT_ASPECT_RATIO = "16 / 7";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function normalizeSeries(seriesValue: unknown): ChartSeriesSpec[] {
  if (!Array.isArray(seriesValue)) {
    return [];
  }

  return seriesValue
    .filter(isRecord)
    .map((item): ChartSeriesSpec | null => {
      const key = readString(item.key);
      if (!key) {
        return null;
      }

      return {
        key,
        label: readString(item.label),
        color: readString(item.color),
        fillOpacity: readNumber(item.fillOpacity),
        strokeWidth: readNumber(item.strokeWidth),
      };
    })
    .filter((item): item is ChartSeriesSpec => item !== null);
}

function normalizeBaseSpec(spec: Record<string, unknown>, type: ChartType) {
  return {
    type,
    title: readString(spec.title),
    className: readString(spec.className),
    aspectRatio: readString(spec.aspectRatio) || DEFAULT_ASPECT_RATIO,
  };
}

export function parseChartSpec(rawSpec: string): ParseChartResult {
  try {
    return { ok: true, value: JSON.parse(rawSpec) };
  } catch {
    return { ok: false, error: "Invalid chart JSON: unable to parse." };
  }
}

export function normalizeChartSpec(parsed: unknown): NormalizeChartResult {
  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: "Invalid chart spec: top-level object is required.",
    };
  }

  const inferredType = readString(parsed.type);

  if (!inferredType) {
    return {
      ok: false,
      error:
        "Invalid chart spec: missing `type`. Supported types are area, pie, radar, funnel, sankey, choropleth.",
    };
  }

  if (
    inferredType !== "area" &&
    inferredType !== "pie" &&
    inferredType !== "radar" &&
    inferredType !== "funnel" &&
    inferredType !== "sankey" &&
    inferredType !== "choropleth"
  ) {
    return {
      ok: false,
      error:
        "Invalid chart spec: unsupported `type`. Supported types are area, pie, radar, funnel, sankey, choropleth.",
    };
  }

  const base = normalizeBaseSpec(parsed, inferredType);

  if (inferredType === "area") {
    if (!Array.isArray(parsed.data)) {
      return {
        ok: false,
        error: "Area chart requires `data` as a non-empty array.",
      };
    }

    const data = parsed.data.filter(isRecord);
    const series = normalizeSeries(parsed.series);
    if (data.length === 0) {
      return { ok: false, error: "Area chart `data` cannot be empty." };
    }
    if (series.length === 0) {
      return {
        ok: false,
        error: "Area chart requires `series` with at least one valid item.",
      };
    }

    return {
      ok: true,
      value: {
        ...base,
        type: "area",
        data,
        series,
        xKey: readString(parsed.xKey) || "date",
        xAxisTicks: readNumber(parsed.xAxisTicks) || 5,
      },
    };
  }

  if (inferredType === "pie") {
    if (!Array.isArray(parsed.data)) {
      return {
        ok: false,
        error: "Pie chart requires `data` as a non-empty array.",
      };
    }

    const options = isRecord(parsed.options) ? parsed.options : {};
    const nameKey = readString(options.nameKey) || "name";
    const valueKey = readString(options.valueKey) || "value";

    const data = parsed.data
      .filter(isRecord)
      .map((item): PieDataPoint | null => {
        const name = readString(item[nameKey]);
        const value = readNumber(item[valueKey]);
        if (!name || value === undefined) {
          return null;
        }

        return {
          name,
          value,
          color: readString(item.color),
        };
      })
      .filter((item): item is PieDataPoint => item !== null);

    if (data.length === 0) {
      return {
        ok: false,
        error:
          "Pie chart `data` cannot be empty, and each row needs name/value.",
      };
    }

    return {
      ok: true,
      value: {
        ...base,
        type: "pie",
        data,
        nameKey,
        valueKey,
      },
    };
  }

  if (inferredType === "radar") {
    if (!Array.isArray(parsed.data)) {
      return {
        ok: false,
        error: "Radar chart requires `data` as a non-empty array.",
      };
    }

    const data = parsed.data.filter(isRecord);
    const series = normalizeSeries(parsed.series);
    const options = isRecord(parsed.options) ? parsed.options : {};
    const axisKey = readString(options.axisKey) || "axis";

    if (data.length === 0) {
      return { ok: false, error: "Radar chart `data` cannot be empty." };
    }
    if (series.length === 0) {
      return {
        ok: false,
        error: "Radar chart requires `series` with at least one valid item.",
      };
    }

    return {
      ok: true,
      value: {
        ...base,
        type: "radar",
        data,
        axisKey,
        series,
      },
    };
  }

  if (inferredType === "funnel") {
    if (!Array.isArray(parsed.data)) {
      return {
        ok: false,
        error: "Funnel chart requires `data` as a non-empty array.",
      };
    }

    const options = isRecord(parsed.options) ? parsed.options : {};
    const stageKey = readString(options.stageKey) || "stage";
    const valueKey = readString(options.valueKey) || "value";

    const data = parsed.data
      .filter(isRecord)
      .map((item): FunnelDataPoint | null => {
        const stage = readString(item[stageKey]);
        const value = readNumber(item[valueKey]);

        if (!stage || value === undefined) {
          return null;
        }

        return { stage, value };
      })
      .filter((item): item is FunnelDataPoint => item !== null);

    if (data.length === 0) {
      return { ok: false, error: "Funnel chart `data` cannot be empty." };
    }

    return {
      ok: true,
      value: {
        ...base,
        type: "funnel",
        data,
      },
    };
  }

  if (inferredType === "sankey") {
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) {
      return {
        ok: false,
        error: "Sankey chart requires `nodes` and `links` arrays.",
      };
    }

    const nodes = parsed.nodes
      .filter(isRecord)
      .map((item): SankeyNode | null => {
        const id = readString(item.id);
        if (!id) {
          return null;
        }

        return {
          id,
          label: readString(item.label),
        };
      })
      .filter((item): item is SankeyNode => item !== null);

    const links = parsed.links
      .filter(isRecord)
      .map((item): SankeyLink | null => {
        const source = readString(item.source);
        const target = readString(item.target);
        const value = readNumber(item.value);

        if (!source || !target || value === undefined) {
          return null;
        }

        return { source, target, value };
      })
      .filter((item): item is SankeyLink => item !== null);

    if (nodes.length === 0 || links.length === 0) {
      return {
        ok: false,
        error: "Sankey chart requires non-empty valid `nodes` and `links`.",
      };
    }

    return {
      ok: true,
      value: {
        ...base,
        type: "sankey",
        nodes,
        links,
      },
    };
  }

  const mapId = readString(parsed.mapId);
  if (!mapId) {
    return {
      ok: false,
      error: "Choropleth chart requires `mapId`.",
    };
  }

  if (!Array.isArray(parsed.data)) {
    return {
      ok: false,
      error: "Choropleth chart requires `data` as a non-empty array.",
    };
  }

  const data = parsed.data
    .filter(isRecord)
    .map((item): ChoroplethDataPoint | null => {
      const featureId = readString(item.featureId);
      const value = readNumber(item.value);
      if (!featureId || value === undefined) {
        return null;
      }
      return { featureId, value };
    })
    .filter((item): item is ChoroplethDataPoint => item !== null);

  if (data.length === 0) {
    return {
      ok: false,
      error: "Choropleth chart `data` cannot be empty.",
    };
  }

  return {
    ok: true,
    value: {
      ...base,
      type: "choropleth",
      mapId,
      data,
    },
  };
}
