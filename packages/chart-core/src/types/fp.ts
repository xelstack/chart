/**
 * 함수형 프로그래밍 타입 정의
 * 순수 함수, 사이드 이펙트, 함수 합성 등의 타입 정의
 * @module types/fp
 */

/**
 * 단항 순수 함수
 * 동일한 입력에 대해 항상 동일한 출력을 반환하고 사이드 이펙트가 없는 함수
 */
export type PureFunction<T, R> = (input: T) => R;

/**
 * 이항 순수 함수
 */
export type PureFunction2<T1, T2, R> = (input1: T1, input2: T2) => R;

/**
 * 다항 순수 함수
 */
export type PureFunctionN<T extends unknown[], R> = (...args: T) => R;

/**
 * 사이드 이펙트 함수 (반환값 없음)
 * 외부 상태를 변경하거나 I/O 작업을 수행하는 함수
 */
export type SideEffect<T> = (input: T) => void;

/**
 * 사이드 이펙트 함수 (반환값 있음)
 */
export type SideEffectWithReturn<T, R> = (input: T) => R;

/**
 * 비동기 사이드 이펙트 함수
 */
export type AsyncSideEffect<T, R> = (input: T) => Promise<R>;

/**
 * 함수를 인자로 받는 고차 함수
 */
export type HigherOrderFunction<T, R> = (fn: (arg: T) => R) => (arg: T) => R;

/**
 * 함수를 반환하는 고차 함수 (커링)
 */
export type CurriedFunction<T1, T2, R> = (arg1: T1) => (arg2: T2) => R;

/**
 * 불변 객체 타입
 * 생성 후 변경할 수 없는 객체
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

/**
 * 불변 배열 타입
 */
export type ImmutableArray<T> = readonly T[];
