/**
 * 파이프라인 유틸리티
 * 여러 함수를 왼쪽에서 오른쪽으로 실행하는 pipe 함수
 * @module utils/fp/pipe
 */

/**
 * 단일 함수 파이프
 */
function pipe<A, B>(fn1: (arg: A) => B): (arg: A) => B;

/**
 * 이중 함수 파이프
 */
function pipe<A, B, C>(fn1: (arg: A) => B, fn2: (arg: B) => C): (arg: A) => C;

/**
 * 삼중 함수 파이프
 */
function pipe<A, B, C, D>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D
): (arg: A) => D;

/**
 * 사중 함수 파이프
 */
function pipe<A, B, C, D, E>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E
): (arg: A) => E;

/**
 * 오중 함수 파이프
 */
function pipe<A, B, C, D, E, F>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F
): (arg: A) => F;

/**
 * 육중 함수 파이프
 */
function pipe<A, B, C, D, E, F, G>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F,
  fn6: (arg: F) => G
): (arg: A) => G;

/**
 * 칠중 함수 파이프
 */
function pipe<A, B, C, D, E, F, G, H>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F,
  fn6: (arg: F) => G,
  fn7: (arg: G) => H
): (arg: A) => H;

/**
 * 팔중 함수 파이프
 */
function pipe<A, B, C, D, E, F, G, H, I>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F,
  fn6: (arg: F) => G,
  fn7: (arg: G) => H,
  fn8: (arg: H) => I
): (arg: A) => I;

/**
 * 구중 함수 파이프
 */
function pipe<A, B, C, D, E, F, G, H, I, J>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F,
  fn6: (arg: F) => G,
  fn7: (arg: G) => H,
  fn8: (arg: H) => I,
  fn9: (arg: I) => J
): (arg: A) => J;

/**
 * 십중 함수 파이프
 */
function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => C,
  fn3: (arg: C) => D,
  fn4: (arg: D) => E,
  fn5: (arg: E) => F,
  fn6: (arg: F) => G,
  fn7: (arg: G) => H,
  fn8: (arg: H) => I,
  fn9: (arg: I) => J,
  fn10: (arg: J) => K
): (arg: A) => K;

/**
 * 여러 함수를 왼쪽에서 오른쪽으로 파이프
 * pipe(f, g, h)(x) === h(g(f(x)))
 *
 * @param fns 파이프할 함수들의 배열
 * @returns 파이프된 함수
 *
 * @example
 * ```typescript
 * const processData = pipe(
 *   (n: number) => n * 2,
 *   (n: number) => n + 1,
 *   (n: number) => `Result: ${n}`
 * );
 * processData(5); // "Result: 11"
 * ```
 */
function pipe<T extends ReadonlyArray<(arg: never) => never>>(
  ...fns: T
): <TArg>(arg: TArg) => TArg {
  if (fns.length === 0) {
    return <TArg>(arg: TArg): TArg => arg;
  }

  if (fns.length === 1) {
    return fns[0] as unknown as <TArg>(arg: TArg) => TArg;
  }

  return <TArg>(arg: TArg): TArg => {
    let result: unknown = arg;
    for (const fn of fns) {
      result = (fn as unknown as (arg: unknown) => unknown)(result);
    }
    return result as TArg;
  };
}

export { pipe };
