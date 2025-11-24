/**
 * 설정 병합 유틸리티
 * 차트 설정을 병합하는 순수 함수들
 * @module utils/config-merge
 */

import type { ChartConfig } from '../types/index';

/**
 * 설정 병합 (얕은 병합)
 * @param base 기본 설정
 * @param override 오버라이드 설정
 * @returns 병합된 설정 (새로운 객체)
 */
export function mergeConfig(base: ChartConfig, override: Partial<ChartConfig>) {
  return { ...base, ...override };
}

/**
 * 설정 깊은 병합 (중첩 객체 처리)
 * @param base 기본 설정
 * @param override 오버라이드 설정
 * @returns 병합된 설정 (새로운 객체)
 */
export function deepMergeConfig(base: ChartConfig, override: Partial<ChartConfig>) {
  const result = { ...base };

  if (override.axes && base.axes) {
    result.axes = {
      ...base.axes,
      ...override.axes,
      x: override.axes.x ? { ...base.axes.x, ...override.axes.x } : base.axes.x,
      y: override.axes.y ? { ...base.axes.y, ...override.axes.y } : base.axes.y,
    };
  } else if (override.axes) {
    result.axes = override.axes;
  }

  if (override.interaction && base.interaction) {
    result.interaction = { ...base.interaction, ...override.interaction };
  } else if (override.interaction) {
    result.interaction = override.interaction;
  }

  if (override.realtime !== undefined && base.realtime !== undefined) {
    const baseRealtime = base.realtime;
    const overrideRealtime = override.realtime;
    result.realtime = { ...baseRealtime, ...overrideRealtime };
  } else if (override.realtime !== undefined) {
    const overrideRealtime = override.realtime;
    result.realtime = overrideRealtime;
  }

  // 나머지 속성은 얕은 병합
  if (override.type !== undefined) result.type = override.type;
  if (override.width !== undefined) result.width = override.width;
  if (override.height !== undefined) result.height = override.height;
  if (override.colors !== undefined) result.colors = override.colors;
  if (override.title !== undefined) result.title = override.title;
  if (override.showLegend !== undefined) result.showLegend = override.showLegend;
  if (override.showGrid !== undefined) result.showGrid = override.showGrid;

  return result;
}
