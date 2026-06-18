/**
 * 오프스크린 캔버스 관리
 * 증분 렌더링을 위한 오프스크린 캔버스 생성 및 관리
 * @module api/incremental/offscreen-canvas
 */

/**
 * 오프스크린 캔버스 매니저 인터페이스
 */
export interface OffscreenCanvasManager {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  isValid: boolean;
  init: (width: number, height: number) => void;
  invalidate: () => void;
  validate: () => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

/**
 * 오프스크린 캔버스 매니저 생성
 * @returns OffscreenCanvasManager 인스턴스
 */
export function createOffscreenCanvas(): OffscreenCanvasManager {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let isValid = false;

  return {
    get canvas() {
      return canvas;
    },
    get ctx() {
      return ctx;
    },
    get isValid() {
      return isValid;
    },

    init(width: number, height: number) {
      canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx = canvas.getContext('2d');
      if (ctx) {
        // canvas.width 설정 시 변환행렬이 초기화되므로 scale로 dpr만 적용
        ctx.scale(dpr, dpr);
      }
      isValid = false;
    },

    invalidate() {
      isValid = false;
    },

    validate() {
      isValid = true;
    },

    resize(width: number, height: number) {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // canvas.width 재설정으로 변환행렬이 초기화되므로 scale로 dpr만 적용
      ctx.scale(dpr, dpr);
      isValid = false;
    },

    destroy() {
      canvas = null;
      ctx = null;
      isValid = false;
    },
  };
}
