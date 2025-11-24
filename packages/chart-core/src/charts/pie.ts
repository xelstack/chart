/**
 * 원형 그래프 차트 구현
 * @module charts/pie
 */

import type { DataPoint } from '../types/index';

/**
 * 원형 그래프 렌더링 옵션
 */
export interface PieChartOptions {
  /** 색상 배열 */
  colors?: string[];
  /** 내부 반지름 (도넛 차트용, 0이면 원형) */
  innerRadius?: number;
  /** 외부 반지름 */
  outerRadius?: number;
}

/**
 * 원형 그래프 렌더링 함수
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param points - 데이터 포인트 배열
 * @param width - Canvas 너비
 * @param height - Canvas 높이
 * @param options - 렌더링 옵션
 */
export function renderPieChart(
  ctx: CanvasRenderingContext2D,
  points: DataPoint[],
  width: number,
  height: number,
  options: PieChartOptions = {}
): void {
  if (points.length === 0) {
    return;
  }

  // 최소 크기 검증
  if (width < 50 || height < 50) {
    return; // 너무 작은 캔버스는 렌더링하지 않음
  }

  const colors = options.colors ?? ['#3366ff', '#ff3366', '#33ff66', '#ff6633', '#6633ff'];
  const innerRadius = options.innerRadius ?? 0;
  const calculatedOuterRadius = Math.min(width, height) / 2 - 20;

  // 음수 반지름 방지
  const outerRadius = options.outerRadius ?? Math.max(calculatedOuterRadius, 10);

  const centerX = width / 2;
  const centerY = height / 2;

  // 반지름 검증
  if (outerRadius <= 0) {
    return; // 유효하지 않은 반지름
  }

  // 총합 계산
  let total = 0;
  for (const point of points) {
    const y = typeof point.y === 'number' ? point.y : Number.parseFloat(String(point.y));
    if (!Number.isNaN(y) && y > 0) {
      total += y;
    }
  }

  if (total === 0) {
    return;
  }

  // 각 섹션 그리기
  let currentAngle = -Math.PI / 2; // 12시 방향부터 시작

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const y = typeof point.y === 'number' ? point.y : Number.parseFloat(String(point.y));

    if (Number.isNaN(y) || y <= 0) {
      continue;
    }

    const sliceAngle = (y / total) * Math.PI * 2;
    const color = colors[i % colors.length];

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    if (innerRadius > 0) {
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    } else {
      ctx.lineTo(centerX, centerY);
    }
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  }
}

