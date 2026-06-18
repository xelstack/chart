/**
 * 위젯 래퍼 모듈 (함수형)
 * 대시보드 환경에서 차트를 위젯으로 사용하기 위한 래퍼입니다.
 * @module widget/widget
 */

import { createChart } from '@chart/api/create-chart';
import type { ChartHandle } from '@chart/api/chart-handle';
import type {
  Dataset,
  ChartConfig,
  ChartState,
  Viewport,
  WidgetConfig,
  WidgetInstance,
} from '@chart/types/index';

/**
 * 위젯 설정 타입 가드
 * @param config - 검증할 설정 객체
 * @returns config가 유효한 WidgetConfig인지 여부
 */
function isValidWidgetConfig(config: unknown): config is WidgetConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'container' in config &&
    'dataset' in config &&
    'chartConfig' in config &&
    config.container instanceof HTMLElement &&
    typeof (config as { dataset: unknown }).dataset === 'object' &&
    (config as { dataset: unknown }).dataset !== null &&
    typeof (config as { chartConfig: unknown }).chartConfig === 'object'
  );
}

/**
 * 위젯 인스턴스를 생성합니다 (함수형 구현).
 *
 * @param config - 위젯 설정
 * @returns 위젯 인스턴스
 *
 * @example
 * ```typescript
 * const widget = createWidget({
 *   container: document.getElementById('widget-container'),
 *   dataset: {
 *     points: [
 *       { x: 0, y: 10 },
 *       { x: 1, y: 20 }
 *     ]
 *   },
 *   chartConfig: {
 *     type: 'line',
 *     width: 400,
 *     height: 300
 *   },
 *   id: 'my-widget',
 *   title: '실시간 차트',
 *   autoResize: true
 * });
 * ```
 */
export function createWidget(config: WidgetConfig): WidgetInstance {
  // 타입 안전성을 위한 명시적 체크
  if (config === null || config === undefined) {
    throw new Error('WidgetConfig는 필수입니다');
  }

  // 타입 가드를 통한 검증: 유효하지 않으면 깊은 곳에서 크래시하지 않고 명확한 에러로 거부
  if (!isValidWidgetConfig(config)) {
    throw new Error(
      '유효하지 않은 WidgetConfig입니다 (container는 HTMLElement, dataset과 chartConfig는 필수입니다)'
    );
  }

  const validatedConfig = config;
  const widgetId = validatedConfig.id ?? `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const widgetContainer = validatedConfig.container;
  const widgetDataset = validatedConfig.dataset;
  // autoResize(기본 true)를 차트의 responsive 옵션으로 매핑하여 ResizeObserver 설치 여부를 제어
  const widgetChartConfig: Partial<ChartConfig> = {
    ...validatedConfig.chartConfig,
    responsive: validatedConfig.autoResize !== false,
  };

  // 함수형 차트 생성
  const chartHandle: ChartHandle = createChart(widgetContainer, widgetDataset, widgetChartConfig);

  // 위젯 인스턴스 (함수형 스타일로 메서드 반환)
  return {
    id: widgetId,

    /**
     * 위젯 데이터를 업데이트합니다.
     * @param dataset - 새로운 데이터셋
     */
    updateData: (dataset: Dataset) => {
      chartHandle.updateData(dataset);
      chartHandle.render();
    },

    /**
     * 위젯 설정을 업데이트합니다.
     * @param config - 차트 설정 (부분 업데이트 가능)
     */
    updateConfig: (config: Partial<ChartConfig>) => {
      chartHandle.updateConfig(config);
      chartHandle.render();
    },

    /**
     * 위젯 크기를 변경합니다.
     * @param width - 새로운 너비 (픽셀)
     * @param height - 새로운 높이 (픽셀)
     */
    resize: (width: number, height: number) => {
      chartHandle.updateConfig({ width, height });
      chartHandle.render();
    },

    /**
     * 위젯의 현재 상태를 반환합니다.
     * 핸들의 실시간 상태를 위임하여 updateData/addPoints 후에도 정확한 pointCount를 반환합니다.
     * @returns 차트 상태
     */
    getState: (): ChartState => chartHandle.getState(),

    /**
     * 위젯의 현재 뷰포트 정보를 반환합니다.
     * @returns 뷰포트 정보
     */
    getViewport: (): Viewport => chartHandle.getViewport(),

    /**
     * 위젯을 제거하고 모든 리소스를 해제합니다.
     */
    destroy: () => {
      chartHandle.destroy();
    },
  };
}
