/**
 * DOM 조작 사이드 이펙트
 * DOM 요소를 생성하고 수정하는 사이드 이펙트 함수들
 * @module effects/dom-manipulation
 */
import { getDeviceInfo } from '@chart/utils/device-detection';

/**
 * Canvas 요소를 생성하고 컨테이너에 추가하는 사이드 이펙트 함수
 * Retina 디스플레이를 지원하도록 pixelRatio를 자동으로 적용합니다.
 * @param container 컨테이너 요소
 * @param width Canvas 논리적 너비 (CSS 픽셀)
 * @param height Canvas 논리적 높이 (CSS 픽셀)
 * @returns 생성된 Canvas 요소
 */
export function createCanvas(container: HTMLElement, width: number, height: number) {
  // 기존 canvas 제거 (중복 생성 방지)
  const existingCanvas = container.querySelector('canvas');

  if (existingCanvas !== null) {
    container.removeChild(existingCanvas);
  }

  // 디바이스 정보 가져오기 (pixelRatio 확인)
  const deviceInfo = getDeviceInfo();
  const pixelRatio = deviceInfo.pixelRatio;

  // Canvas 요소 생성
  const canvas = document.createElement('canvas');

  // 고해상도 디스플레이 지원: 실제 픽셀 크기는 pixelRatio 배로 설정
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  // CSS 크기는 논리적 크기로 설정
  canvas.style.display = 'block';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Canvas 2D context도 pixelRatio만큼 스케일링
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio);
  }

  // 컨테이너에 추가
  container.appendChild(canvas);

  return canvas;
}

/**
 * Canvas 크기를 업데이트하는 사이드 이펙트 함수
 * Retina 디스플레이를 지원하도록 pixelRatio를 자동으로 적용합니다.
 * @param canvas Canvas 요소
 * @param width 새로운 논리적 너비 (CSS 픽셀)
 * @param height 새로운 논리적 높이 (CSS 픽셀)
 */
export function updateCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  // 디바이스 정보 가져오기 (pixelRatio 확인)
  const deviceInfo = getDeviceInfo();
  const pixelRatio = deviceInfo.pixelRatio;

  // 고해상도 디스플레이 지원
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Canvas 2D context도 pixelRatio만큼 스케일링
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio);
  }
}

/**
 * Canvas 요소를 제거하는 사이드 이펙트 함수
 * @param canvas 제거할 Canvas 요소
 */
export function removeCanvas(canvas: HTMLCanvasElement) {
  if (canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
}

/**
 * Canvas 리소스를 정리하는 사이드 이펙트 함수
 * removeCanvas의 별칭 (일관된 네이밍)
 * @param canvas 정리할 Canvas 요소
 */
export function destroyCanvas(canvas: HTMLCanvasElement) {
  removeCanvas(canvas);
}
