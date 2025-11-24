/**
 * 이벤트 핸들러 사이드 이펙트
 * 이벤트 리스너를 설정하고 해제하는 사이드 이펙트 함수들
 * @module effects/event-handlers
 */

/**
 * ResizeObserver를 설정하는 사이드 이펙트 함수
 * @param element 관찰할 요소
 * @param callback 크기 변경 시 호출될 콜백 함수
 * @returns cleanup 함수 (ResizeObserver 해제)
 */
export function setupResizeObserver(
  element: HTMLElement,
  callback: (width: number, height: number) => void
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    // ResizeObserver가 지원되지 않는 경우 fallback
    return () => {
      // cleanup 함수는 항상 반환해야 함
    };
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      callback(width, height);
    }
  });

  observer.observe(element);

  // cleanup 함수 반환
  return () => {
    observer.disconnect();
  };
}

/**
 * ResizeObserver를 해제하는 사이드 이펙트 함수
 * @param cleanup setupResizeObserver로 반환된 cleanup 함수
 */
export function cleanupResizeObserver(cleanup: (() => void) | null | undefined): void {
  if (cleanup && typeof cleanup === 'function') {
    cleanup();
  }
}

