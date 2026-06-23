import { describe, expectTypeOf, it } from "vitest";

import type {
  AppendInput,
  ChartConfig,
  ColumnarPointBatch,
  PointObject,
  PointTuple,
} from "./public-types";

describe("public-types", () => {
  it("models append input tiers", () => {
    expectTypeOf<readonly PointObject[]>().toExtend<AppendInput>();
    expectTypeOf<readonly PointTuple[]>().toExtend<AppendInput>();
    expectTypeOf<ColumnarPointBatch>().toExtend<AppendInput>();

    expectTypeOf<
      readonly [{ x: string; y: number }]
    >().not.toExtend<AppendInput>();
  });

  it("models a minimal realtime line chart config", () => {
    type MinimalRealtimeLineConfig = {
      type: "line";
      realtime: true;
      data: {
        datasets: [
          {
            id: "cpu-user";
            label: "CPU user";
            data: readonly PointObject[];
          },
        ];
      };
    };

    expectTypeOf<MinimalRealtimeLineConfig>().toExtend<ChartConfig>();
  });
});
