/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderGrid } from '../../../src/effects/canvas-render';

describe('renderGrid', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock Canvas Rendering Context
    ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;
  });

  it('should render grid lines', () => {
    const beginPathSpy = vi.spyOn(ctx, 'beginPath');
    const strokeSpy = vi.spyOn(ctx, 'stroke');

    renderGrid(ctx, 800, 600, 0);

    expect(beginPathSpy).toHaveBeenCalled();
    expect(strokeSpy).toHaveBeenCalled();
  });

  it('should respect title offset', () => {
    const moveToSpy = vi.spyOn(ctx, 'moveTo');
    const lineToSpy = vi.spyOn(ctx, 'lineTo');

    renderGrid(ctx, 800, 600, 50);

    // Vertical lines should start at titleOffset
    expect(moveToSpy).toHaveBeenCalledWith(expect.any(Number), 50);
    expect(lineToSpy).toHaveBeenCalledWith(expect.any(Number), 600);
  });

  it('should use correct stroke style', () => {
    renderGrid(ctx, 800, 600, 0);

    expect(ctx.strokeStyle).toBe('rgba(0, 0, 0, 0.1)');
  });

  it('should use correct line width', () => {
    renderGrid(ctx, 800, 600, 0);

    expect(ctx.lineWidth).toBe(1);
  });

  it('should save and restore context', () => {
    const saveSpy = vi.spyOn(ctx, 'save');
    const restoreSpy = vi.spyOn(ctx, 'restore');

    renderGrid(ctx, 800, 600, 0);

    expect(saveSpy).toHaveBeenCalled();
    expect(restoreSpy).toHaveBeenCalled();
  });

  it('should render horizontal and vertical lines', () => {
    const moveToSpy = vi.spyOn(ctx, 'moveTo');
    const lineToSpy = vi.spyOn(ctx, 'lineTo');

    renderGrid(ctx, 800, 600, 0);

    // Should have both horizontal and vertical lines
    const moveToCalls = moveToSpy.mock.calls;
    const lineToCalls = lineToSpy.mock.calls;

    expect(moveToCalls.length).toBeGreaterThan(0);
    expect(lineToCalls.length).toBeGreaterThan(0);
  });
});
