/**
 * 커링 유틸리티
 * 이항 함수를 커링된 함수로 변환
 * @module utils/fp/curry
 */

/**
 * 이항 함수를 커링된 함수로 변환
 * curry(f)(a)(b) === f(a, b)
 *
 * @param fn 커링할 이항 함수
 * @returns 커링된 함수
 */
export function curry<T1, T2, R>(fn: (arg1: T1, arg2: T2) => R): (arg1: T1) => (arg2: T2) => R {
  return (arg1: T1) => {
    return (arg2: T2) => {
      return fn(arg1, arg2);
    };
  };
}
