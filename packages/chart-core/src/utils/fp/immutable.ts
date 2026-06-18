/**
 * 불변성 유틸리티
 * 객체와 배열의 불변성을 보장하는 유틸리티 함수들
 * @module utils/fp/immutable
 */

/**
 * 객체를 깊게 동결 (deep freeze)
 * @param obj 동결할 객체
 * @param seen 순환 참조 추적용 WeakSet (내부 사용, 호출 시 생략)
 * @returns 동결된 객체
 */
export function deepFreeze<T>(obj: T, seen: WeakSet<object> = new WeakSet()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 이미 동결된 객체는 건너뛰기
  if (Object.isFrozen(obj)) {
    return obj;
  }

  // 순환 참조 방지: 이미 방문 중인 객체는 다시 들어가지 않음 (스택 오버플로 방지)
  if (seen.has(obj as object)) {
    return obj;
  }
  seen.add(obj as object);

  // 배열과 객체 모두 처리
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value, seen);
    }
  });

  return Object.freeze(obj);
}

/**
 * 객체를 불변하게 업데이트
 * @param obj 원본 객체
 * @param updates 업데이트할 속성들
 * @returns 새로운 객체 (원본은 변경되지 않음)
 */
export function immutableUpdate<T extends Record<string, unknown>>(
  obj: T,
  updates: Partial<T>
): T {
  return { ...obj, ...updates };
}

