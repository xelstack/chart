/**
 * Canvas 렌더링 사이드 이펙트
 * Canvas에 차트를 그리는 사이드 이펙트 함수들
 * @module effects/canvas-render
 */

import type { Dataset, ChartConfig, Viewport, DataPoint } from '../types/index';
import { renderLineChart } from '../charts/line';
import { renderBarChart } from '../charts/bar';
import { renderPieChart } from '../charts/pie';
import { renderScatterChart } from '../charts/scatter';

/**
 * 렌더링 결과
 */
export interface RenderResult {
  rendered: boolean;
  timestamp?: number;
}

/**
 * 차트 렌더러 함수 타입
 * 함수형 프로그래밍: 일급 함수로 차트 렌더링을 추상화
 */
type ChartRendererFn = (
  ctx: CanvasRenderingContext2D,
  dataset: Dataset,
  viewport: Viewport,
  width: number,
  height: number,
  config: ChartConfig
) => void;

/**
 * 차트 타입별 렌더러를 반환하는 순수 함수
 * 함수형 프로그래밍: 고차 함수를 통한 렌더러 선택
 */
/**
 * 시리즈별로 데이터 포인트를 그룹화하는 헬퍼 함수
 */
const groupPointsBySeries = (points: DataPoint[]) => {
  const seriesMap = new Map<string | undefined, DataPoint[]>();

  for (const point of points) {
    const seriesKey = point.series;
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }
    const seriesPoints = seriesMap.get(seriesKey);
    if (seriesPoints) {
      seriesPoints.push(point);
    }
  }

  return seriesMap;
};

/**
 * 카테고리형 x 값을 숫자 인덱스로 매핑하는 헬퍼 함수
 * Multi-series에서 같은 카테고리가 같은 위치에 오도록 보장
 */
const createCategoryIndexMap = (points: DataPoint[]) => {
  const categories = new Map<string, number>();
  let index = 0;

  for (const point of points) {
    // 문자열 카테고리만 매핑
    if (typeof point.x === 'string') {
      if (!categories.has(point.x)) {
        categories.set(point.x, index++);
      }
    }
  }

  return categories;
};

const getChartRenderer = (type: string): ChartRendererFn => {
  const renderers: Record<string, ChartRendererFn> = {
    line: (ctx, dataset, viewport, width, height, config) => {
      // Multi-series 지원: 시리즈별로 그룹화하여 렌더링
      const seriesMap = groupPointsBySeries(dataset.points);
      const categoryMap = createCategoryIndexMap(dataset.points);
      const colors = config.colors ?? ['#3366ff'];

      let colorIndex = 0;
      for (const [, points] of seriesMap) {
        renderLineChart(ctx, points, viewport, width, height, {
          color: colors[colorIndex % colors.length],
          categoryMap,
        });
        colorIndex++;
      }
    },
    bar: (ctx, dataset, viewport, width, height, config) => {
      // Multi-series 지원: 시리즈별로 그룹화하여 렌더링
      const seriesMap = groupPointsBySeries(dataset.points);
      const colors = config.colors ?? ['#3366ff'];

      let colorIndex = 0;
      for (const [, points] of seriesMap) {
        renderBarChart(ctx, points, viewport, width, height, {
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      }
    },
    pie: (ctx, dataset, _viewport, width, height, config) => {
      renderPieChart(ctx, dataset.points, width, height, {
        colors: config.colors,
      });
    },
    scatter: (ctx, dataset, viewport, width, height, config) => {
      // Multi-series 지원: 시리즈별로 그룹화하여 렌더링
      const seriesMap = groupPointsBySeries(dataset.points);
      const colors = config.colors ?? ['#3366ff'];

      let colorIndex = 0;
      for (const [, points] of seriesMap) {
        renderScatterChart(ctx, points, viewport, width, height, {
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      }
    },
  };

  return renderers[type] ?? renderers.line; // 기본값: line chart
};

/**
 * 차트 타이틀을 렌더링하는 사이드 이펙트 함수
 * @param ctx Canvas 렌더링 컨텍스트
 * @param title 타이틀 텍스트 (선택)
 * @param width Canvas 너비
 */
export function renderTitle(
  ctx: CanvasRenderingContext2D,
  title: string | undefined,
  width: number
) {
  // nullish coalescing 사용하여 타입 안전성 보장
  const titleText = title ?? '';
  if (titleText.trim() === '') {
    return;
  }

  ctx.save();
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(titleText, width / 2, 30);
  ctx.restore();
}

/**
 * 그리드를 렌더링하는 사이드 이펙트 함수
 * @param ctx Canvas 렌더링 컨텍스트
 * @param width Canvas 너비
 * @param height Canvas 높이
 * @param titleOffset 타이틀이 있는 경우 오프셋
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  titleOffset: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;

  const chartHeight = height - titleOffset;
  const numHorizontalLines = 5;
  const numVerticalLines = 5;

  // 수평선 (y축 그리드)
  for (let i = 0; i <= numHorizontalLines; i++) {
    const y = titleOffset + (chartHeight / numHorizontalLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 수직선 (x축 그리드)
  for (let i = 0; i <= numVerticalLines; i++) {
    const x = (width / numVerticalLines) * i;
    ctx.beginPath();
    ctx.moveTo(x, titleOffset);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Canvas에 차트를 렌더링하는 사이드 이펙트 함수
 * @param ctx Canvas 렌더링 컨텍스트
 * @param dataset 차트 데이터셋
 * @param config 차트 설정
 * @param viewport 뷰포트 정보
 * @returns 렌더링 결과
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  dataset: Dataset,
  config: ChartConfig,
  viewport: Viewport
): RenderResult {
  // 논리적 크기 사용 (CSS 픽셀)
  // Canvas는 이미 devicePixelRatio가 곱해진 물리적 크기이지만,
  // context가 scale되어 있으므로 CSS 픽셀 크기(clientWidth/clientHeight)를 사용
  const width = config.width ?? ctx.canvas.clientWidth;
  const height = config.height ?? ctx.canvas.clientHeight;

  // 배경 클리어 (논리적 좌표 사용, context가 이미 scale됨)
  ctx.clearRect(0, 0, width, height);

  // 타이틀 렌더링 (있는 경우)
  const title = (config as { title?: string }).title;
  const titleHeight = typeof title === 'string' && title.length > 0 ? 50 : 0;
  renderTitle(ctx, title, width);

  // 그리드 렌더링 (showGrid가 true인 경우)
  if (config.showGrid === true) {
    renderGrid(ctx, width, height, titleHeight);
  }

  // 차트 영역 계산 (타이틀이 있으면 아래로 이동)
  const chartHeight = height - titleHeight;

  // Canvas context를 타이틀 오프셋만큼 이동
  ctx.save();
  ctx.translate(0, titleHeight);

  // 차트 타입에 따라 렌더링 (함수형 프로그래밍: 고차 함수 사용)
  const renderer = getChartRenderer(config.type);
  renderer(ctx, dataset, viewport, width, chartHeight, config);

  ctx.restore();

  return {
    rendered: true,
    timestamp: performance.now(),
  };
}
