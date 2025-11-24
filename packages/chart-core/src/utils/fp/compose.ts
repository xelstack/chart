/**
 * 함수 합성 유틸리티
 * 여러 함수를 오른쪽에서 왼쪽으로 합성하는 compose 함수
 * @module utils/fp/compose
 */

/**
 * 단일 함수 합성
 */
function compose<A, B>(fn1: (arg: A) => B): (arg: A) => B;

/**
 * 이중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C>(fn1: (arg: B) => C, fn2: (arg: A) => B): (arg: A) => C;

/**
 * 삼중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D>(
  fn1: (arg: C) => D,
  fn2: (arg: B) => C,
  fn3: (arg: A) => B
): (arg: A) => D;

/**
 * 사중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E>(
  fn1: (arg: D) => E,
  fn2: (arg: C) => D,
  fn3: (arg: B) => C,
  fn4: (arg: A) => B
): (arg: A) => E;

/**
 * 오중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F>(
  fn1: (arg: E) => F,
  fn2: (arg: D) => E,
  fn3: (arg: C) => D,
  fn4: (arg: B) => C,
  fn5: (arg: A) => B
): (arg: A) => F;

/**
 * 육중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F, G>(
  fn1: (arg: F) => G,
  fn2: (arg: E) => F,
  fn3: (arg: D) => E,
  fn4: (arg: C) => D,
  fn5: (arg: B) => C,
  fn6: (arg: A) => B
): (arg: A) => G;

/**
 * 칠중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F, G, H>(
  fn1: (arg: G) => H,
  fn2: (arg: F) => G,
  fn3: (arg: E) => F,
  fn4: (arg: D) => E,
  fn5: (arg: C) => D,
  fn6: (arg: B) => C,
  fn7: (arg: A) => B
): (arg: A) => H;

/**
 * 팔중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F, G, H, I>(
  fn1: (arg: H) => I,
  fn2: (arg: G) => H,
  fn3: (arg: F) => G,
  fn4: (arg: E) => F,
  fn5: (arg: D) => E,
  fn6: (arg: C) => D,
  fn7: (arg: B) => C,
  fn8: (arg: A) => B
): (arg: A) => I;

/**
 * 구중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F, G, H, I, J>(
  fn1: (arg: I) => J,
  fn2: (arg: H) => I,
  fn3: (arg: G) => H,
  fn4: (arg: F) => G,
  fn5: (arg: E) => F,
  fn6: (arg: D) => E,
  fn7: (arg: C) => D,
  fn8: (arg: B) => C,
  fn9: (arg: A) => B
): (arg: A) => J;

/**
 * 십중 함수 합성 (오른쪽에서 왼쪽)
 */
function compose<A, B, C, D, E, F, G, H, I, J, K>(
  fn1: (arg: J) => K,
  fn2: (arg: I) => J,
  fn3: (arg: H) => I,
  fn4: (arg: G) => H,
  fn5: (arg: F) => G,
  fn6: (arg: E) => F,
  fn7: (arg: D) => E,
  fn8: (arg: C) => D,
  fn9: (arg: B) => C,
  fn10: (arg: A) => B
): (arg: A) => K;

/**
 * 여러 함수를 오른쪽에서 왼쪽으로 합성
 * compose(f, g, h)(x) === f(g(h(x)))
 *
 * @param fns 합성할 함수들의 배열
 * @returns 합성된 함수
 *
 * @example
 * ```typescript
 * const processData = compose(
 *   (s: string) => s.toUpperCase(),
 *   (n: number) => `Result: ${n}`,
 *   (n: number) => n + 1,
 *   (n: number) => n * 2
 * );
 * processData(5); // "RESULT: 11"
 * ```
 */
function compose<T extends ReadonlyArray<(arg: never) => never>>(
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
    for (let i = fns.length - 1; i >= 0; i--) {
      result = (fns[i] as unknown as (arg: unknown) => unknown)(result);
    }
    return result as TArg;
  };
}

export { compose };
