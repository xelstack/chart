export type ChartType = "line" | "area";

export type TimeValue = number | Date;

export type YValue = number | null;

export interface PointObject {
  x: TimeValue;
  y: YValue;
}
export type PointTuple = readonly [TimeValue, YValue];

export interface ColumnarPointBatch {
  x: Float64Array;
  y: Float64Array;
}

export type AppendInput =
  | readonly PointObject[]
  | readonly PointTuple[]
  | ColumnarPointBatch;

export type RealtimeOptions =
  | true
  | {
      ordered?: boolean;
    };

export type InitialDataInput = AppendInput;

export interface DatasetConfig {
  id?: string;
  label?: string;
  data: InitialDataInput;
}

export interface ChartData {
  datasets: DatasetConfig[];
}

export interface ChartConfig {
  type: ChartType;
  realtime?: boolean | RealtimeOptions;
  data: ChartData;
}
