/**
 * deepFreeze 단위 테스트
 */
import { describe, it, expect } from 'vitest';
import { deepFreeze } from '../../../src/utils/fp/immutable';

describe('deepFreeze', () => {
  it('중첩 객체와 배열을 깊게 동결해야 함', () => {
    const obj = { a: { b: 1 }, list: [1, 2, 3] };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.list)).toBe(true);
  });

  // 회귀: 순환 참조 시 무한 재귀로 스택 오버플로가 발생하던 문제
  it('순환 참조가 있어도 스택 오버플로 없이 동결해야 함', () => {
    const a: Record<string, unknown> = { name: 'a' };
    const b: Record<string, unknown> = { name: 'b' };
    a.b = b;
    b.a = a;

    expect(() => deepFreeze(a)).not.toThrow();
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(b)).toBe(true);
  });

  it('자기 참조(메타데이터)가 있어도 동결해야 함', () => {
    const point: Record<string, unknown> = { x: 0, y: 0, metadata: {} };
    (point.metadata as Record<string, unknown>).parent = point;

    expect(() => deepFreeze(point)).not.toThrow();
    expect(Object.isFrozen(point)).toBe(true);
    expect(Object.isFrozen(point.metadata)).toBe(true);
  });
});
