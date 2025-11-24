import { createChart } from '@xelstack/chart-core';

// 전역 객체에 차트 인스턴스를 저장 (E2E 테스트용)
declare global {
  interface Window {
    chart: ReturnType<typeof createChart> | undefined;
    charts: {
      line?: ReturnType<typeof createChart>;
      bar?: ReturnType<typeof createChart>;
      pie?: ReturnType<typeof createChart>;
      scatter?: ReturnType<typeof createChart>;
    };
    createChart: typeof createChart; // E2E 테스트에서 사용할 수 있도록 전역으로 노출
  }
}

// createChart를 전역으로 노출 (E2E 테스트용)
window.createChart = createChart;

// E2E 테스트를 위해 전역 객체 초기화 (자동 차트 생성은 하지 않음)
window.chart = undefined;
window.charts = {};

