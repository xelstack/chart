/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  getDeviceInfo,
  isMobileDevice,
  isLowPerformanceDevice,
} from '../../src/utils/device-detection';

describe('device-detection', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  afterEach(() => {
    // Restore original navigator after each test
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  describe('getDeviceInfo', () => {
    it('should detect desktop device', () => {
      // Remove touch support
      delete (window as { ontouchstart?: unknown }).ontouchstart;

      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          maxTouchPoints: 0,
        },
      });

      const info = getDeviceInfo();

      expect(info.type).toBe('desktop');
      expect(info.isTouchDevice).toBe(false);
    });

    it('should detect mobile device (iPhone)', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          hardwareConcurrency: 2,
          maxTouchPoints: 5,
        },
      });

      const info = getDeviceInfo();

      expect(info.type).toBe('mobile');
      expect(info.isTouchDevice).toBe(true);
    });

    it('should detect tablet device (iPad)', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent:
            'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          hardwareConcurrency: 4,
          maxTouchPoints: 5,
        },
      });

      const info = getDeviceInfo();

      expect(info.type).toBe('tablet');
      expect(info.isTouchDevice).toBe(true);
    });

    it('should detect low performance device', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 2,
          deviceMemory: 2,
          maxTouchPoints: 0,
        },
      });

      const info = getDeviceInfo();

      expect(info.performance).toBe('low');
    });

    it('should detect medium performance device', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          deviceMemory: 4,
          maxTouchPoints: 0,
        },
      });

      const info = getDeviceInfo();

      expect(info.performance).toBe('medium');
    });

    it('should detect high performance device', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 8,
          deviceMemory: 16,
          maxTouchPoints: 0,
        },
      });

      const info = getDeviceInfo();

      expect(info.performance).toBe('high');
    });

    it('should detect high DPI display (Retina)', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      const info = getDeviceInfo();

      expect(info.isHighDPI).toBe(true);
      expect(info.pixelRatio).toBe(2);
    });

    it('should detect normal DPI display', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });

      const info = getDeviceInfo();

      expect(info.isHighDPI).toBe(false);
      expect(info.pixelRatio).toBe(1);
    });
  });

  describe('isMobileDevice', () => {
    it('should return true for mobile devices', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          hardwareConcurrency: 2,
          maxTouchPoints: 5,
        },
      });

      expect(isMobileDevice()).toBe(true);
    });

    it('should return false for desktop devices', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          maxTouchPoints: 0,
        },
      });

      expect(isMobileDevice()).toBe(false);
    });

    it('should return false for tablet devices', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent:
            'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          hardwareConcurrency: 4,
          maxTouchPoints: 5,
        },
      });

      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isLowPerformanceDevice', () => {
    it('should return true for low performance devices (2 cores)', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 2,
          deviceMemory: 4,
          maxTouchPoints: 0,
        },
      });

      expect(isLowPerformanceDevice()).toBe(true);
    });

    it('should return true for low performance devices (2GB RAM)', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          deviceMemory: 2,
          maxTouchPoints: 0,
        },
      });

      expect(isLowPerformanceDevice()).toBe(true);
    });

    it('should return false for medium performance devices', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          deviceMemory: 4,
          maxTouchPoints: 0,
        },
      });

      expect(isLowPerformanceDevice()).toBe(false);
    });

    it('should return false for high performance devices', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 8,
          deviceMemory: 16,
          maxTouchPoints: 0,
        },
      });

      expect(isLowPerformanceDevice()).toBe(false);
    });
  });
});
