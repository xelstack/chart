import type { ChartType, InitialDataInput } from "./public-types";

export type SeriesId = string;

export interface SeriesDescriptor {
  id: SeriesId;
  label: string;
  type: ChartType;
  visible: boolean;
}

export interface NormalizedRealtimeOptions {
  enabled: boolean;
  ordered: boolean;
}

export interface NormalizedDatasetConfig {
  series: SeriesDescriptor;
  data: InitialDataInput;
}

export interface NormalizedChartConfig {
  type: ChartType;
  realtime: NormalizedRealtimeOptions;
  datasets: NormalizedDatasetConfig[];
}

export type ConfigValidationIssueCode = "invalid_chart_type" | "empty_datasets";

export interface ConfigValidationIssue {
  code: ConfigValidationIssueCode;
  message: string;
}

export type ConfigResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ConfigValidationIssue[] };
