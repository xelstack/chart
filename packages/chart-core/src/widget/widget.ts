/**
 * 위젯 래퍼 모듈 (함수형)
 * 대시보드 환경에서 차트를 위젯으로 사용하기 위한 래퍼입니다.
 * @module widget/widget
 */

import { createChart } from '../api/create-chart';
import type { ChartHandle } from '../api/chart-handle';
import type {
  Dataset,
  ChartConfig,
  ChartState,
  Viewport,
  WidgetConfig,
  WidgetInstance,
} from '../types/index';

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

  // 타입 가드를 통한 안전한 속성 접근
  const validatedConfig = isValidWidgetConfig(config) ? config : (config as WidgetConfig);
  const widgetId = validatedConfig.id ?? `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const widgetContainer = validatedConfig.container;
  const widgetDataset = validatedConfig.dataset;
  const widgetChartConfig = validatedConfig.chartConfig;

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
     * @returns 차트 상태
     */
    getState: (): ChartState => {
      // 함수형 API에서는 상태를 직접 노출하지 않으므로
      // 기본 상태 객체 반환
      return {
        status: 'ready',
        pointCount: widgetDataset.points.length,
      };
    },

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
