/**
 * 디바이스 감지 유틸리티
 * 모바일 디바이스 및 성능 특성을 감지합니다.
 * @module utils/device-detection
 */

/**
 * 디바이스 타입
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * 디바이스 성능 레벨
 */
export type DevicePerformance = 'low' | 'medium' | 'high';

/**
 * 디바이스 정보
 */
export interface DeviceInfo {
  /** 디바이스 타입 */
  type: DeviceType;
  /** 디바이스 성능 레벨 */
  performance: DevicePerformance;
  /** 터치 지원 여부 */
  isTouchDevice: boolean;
  /** 고해상도 디스플레이 여부 */
  isHighDPI: boolean;
  /** devicePixelRatio */
  pixelRatio: number;
}

/**
 * 모바일 디바이스 감지
 * User-Agent를 기반으로 모바일 디바이스를 감지합니다.
 */
function detectMobileDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
  ];

  return mobilePatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * 태블릿 디바이스 감지
 */
function detectTabletDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const tabletPatterns = [/ipad/i, /android(?!.*mobile)/i, /tablet/i];

  return tabletPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * 터치 디바이스 감지
 */
function detectTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as { msMaxTouchPoints?: number }).msMaxTouchPoints !== undefined
  );
}

/**
 * 디바이스 성능 레벨 감지
 * 하드웨어 concurrency와 메모리 정보를 기반으로 성능을 추정합니다.
 */
function detectDevicePerformance() {
  if (typeof window === 'undefined') {
    return 'medium';
  }

  const navigator = window.navigator;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 2;
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;

  // 저사양: CPU 코어 2개 이하 또는 메모리 2GB 이하
  if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
    return 'low';
  }

  // 고사양: CPU 코어 4개 이상 및 메모리 8GB 이상
  if (hardwareConcurrency >= 4 && deviceMemory >= 8) {
    return 'high';
  }

  return 'medium';
}

/**
 * 디바이스 정보 가져오기
 * 현재 디바이스의 타입, 성능, 터치 지원 여부 등을 반환합니다.
 */
export function getDeviceInfo() {
  const isMobile = detectMobileDevice();
  const isTablet = detectTabletDevice();
  const isTouch = detectTouchDevice();
  const pixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;

  let deviceType: DeviceType;
  if (isMobile && !isTablet) {
    deviceType = 'mobile';
  } else if (isTablet) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  const performance = detectDevicePerformance();
  const isHighDPI = pixelRatio > 1;

  return {
    type: deviceType,
    performance,
    isTouchDevice: isTouch,
    isHighDPI,
    pixelRatio,
  };
}

/**
 * 모바일 디바이스 여부 확인
 */
export function isMobileDevice() {
  return getDeviceInfo().type === 'mobile';
}

/**
 * 저사양 디바이스 여부 확인
 */
export function isLowPerformanceDevice() {
  return getDeviceInfo().performance === 'low';
}
