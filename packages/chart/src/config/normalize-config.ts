import type {
  ConfigResult,
  ConfigValidationIssue,
  NormalizedChartConfig,
  NormalizedDatasetConfig,
  NormalizedRealtimeOptions,
} from "@/domain/internal-types";
import type {
  ChartConfig,
  ChartType,
  DatasetConfig,
} from "@/domain/public-types";

const normalizeRealtimeOptions = (
  realtime: ChartConfig["realtime"],
): NormalizedRealtimeOptions => {
  if (realtime === true) {
    return {
      enabled: true,
      ordered: true,
    };
  }

  if (typeof realtime === "object") {
    return {
      enabled: true,
      ordered: realtime.ordered ?? true,
    };
  }

  return {
    enabled: false,
    ordered: true,
  };
};

const normalizeDataset = (
  dataset: DatasetConfig,
  index: number,
  type: ChartType,
): NormalizedDatasetConfig => {
  const id = dataset.id ?? `series-${index}`;
  return {
    series: {
      id,
      label: dataset.label ?? id,
      type,
      visible: true,
    },
    data: dataset.data,
  };
};

const createInvalidChartTypeIssue = (): ConfigValidationIssue => ({
  code: "invalid_chart_type",
  message: 'ChartConfig.type must be "line" or "area".',
});

const createEmptyDatasetsIssue = (): ConfigValidationIssue => ({
  code: "empty_datasets",
  message: "ChartConfig.data.datasets must contain at least one dataset.",
});

const validateConfig = ({
  type,
  data,
}: ChartConfig): ConfigValidationIssue[] => {
  const issues: ConfigValidationIssue[] = [];

  if (type !== "line" && type !== "area") {
    issues.push(createInvalidChartTypeIssue());
  }

  if (data.datasets.length === 0) {
    issues.push(createEmptyDatasetsIssue());
  }

  return issues;
};

export const normalizeConfig = (
  config: ChartConfig,
): ConfigResult<NormalizedChartConfig> => {
  const issues = validateConfig(config);

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
    };
  }

  return {
    ok: true,
    value: {
      type: config.type,
      realtime: normalizeRealtimeOptions(config.realtime),
      datasets: config.data.datasets.map((dataset, index) =>
        normalizeDataset(dataset, index, config.type),
      ),
    },
  };
};
