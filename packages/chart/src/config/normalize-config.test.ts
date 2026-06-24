import { describe, expect, it } from "vitest";

import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";

describe("normalizeConfig", () => {
  it("normalizes a minimal realtime line chart config", () => {
    const points = [{ x: 0, y: 1 }] as const;

    const config: ChartConfig = {
      type: "line",
      realtime: true,
      data: {
        datasets: [
          {
            label: "CPU user",
            data: points,
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toEqual({
      ok: true,
      value: {
        type: "line",
        realtime: {
          enabled: true,
          ordered: true,
        },
        datasets: [
          {
            series: {
              id: "series-0",
              label: "CPU user",
              type: "line",
              visible: true,
            },
            data: points,
          },
        ],
      },
    });
  });

  it("normalizes missing realtime as disabled ordered mode", () => {
    const points = [{ x: 0, y: 1 }] as const;

    const config: ChartConfig = {
      type: "line",
      data: {
        datasets: [
          {
            id: "cpu-user",
            data: points,
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toMatchObject({
      ok: true,
      value: {
        realtime: {
          enabled: false,
          ordered: true,
        },
      },
    });
  });

  it("preserves explicit realtime ordered option", () => {
    const points = [{ x: 0, y: 1 }] as const;

    const config: ChartConfig = {
      type: "line",
      realtime: {
        ordered: false,
      },
      data: {
        datasets: [
          {
            id: "cpu-user",
            data: points,
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toMatchObject({
      ok: true,
      value: {
        realtime: {
          enabled: true,
          ordered: false,
        },
      },
    });
  });

  it("preserves explicit dataset id", () => {
    const points = [{ x: 0, y: 1 }] as const;

    const config: ChartConfig = {
      type: "area",
      data: {
        datasets: [
          {
            id: "cpu-user",
            label: "CPU user",
            data: points,
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toMatchObject({
      ok: true,
      value: {
        type: "area",
        datasets: [
          {
            series: {
              id: "cpu-user",
              label: "CPU user",
              type: "area",
              visible: true,
            },
          },
        ],
      },
    });
  });

  it("uses dataset id as label fallback", () => {
    const points = [{ x: 0, y: 1 }] as const;

    const config: ChartConfig = {
      type: "line",
      data: {
        datasets: [
          {
            id: "cpu-user",
            data: points,
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toMatchObject({
      ok: true,
      value: {
        datasets: [
          {
            series: {
              id: "cpu-user",
              label: "cpu-user",
            },
          },
        ],
      },
    });
  });

  it("returns validation issue for empty datasets", () => {
    const config: ChartConfig = {
      type: "line",
      data: {
        datasets: [],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          code: "empty_datasets",
          message:
            "ChartConfig.data.datasets must contain at least one dataset.",
        },
      ],
    });
  });

  it("returns validation issue for invalid chart type", () => {
    const config: ChartConfig = {
      // @ts-expect-error runtime validation covers untyped JavaScript callers.
      type: "bar",
      data: {
        datasets: [
          {
            data: [{ x: 0, y: 1 }],
          },
        ],
      },
    };

    const result = normalizeConfig(config);

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          code: "invalid_chart_type",
          message: 'ChartConfig.type must be "line" or "area".',
        },
      ],
    });
  });
});
