/**
 * 에러 클래스 정의
 * @module utils/errors
 */

/**
 * 검증 에러
 * 데이터 또는 설정 검증 실패 시 발생합니다.
 */
export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 타입 에러
 * 타입이 맞지 않거나 필수 파라미터가 누락된 경우 발생합니다.
 */
export class ChartTypeError extends Error {
  public readonly param?: string;

  constructor(message: string, param?: string) {
    super(message);
    this.name = 'ChartTypeError';
    this.param = param;
    Object.setPrototypeOf(this, ChartTypeError.prototype);
  }
}

