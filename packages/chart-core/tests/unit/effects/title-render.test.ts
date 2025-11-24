/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTitle } from '../../../src/effects/canvas-render';

describe('renderTitle', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock Canvas Rendering Context
    ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      font: '',
      fillStyle: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D;
  });

  it('should render title at top center', () => {
    const fillTextSpy = vi.spyOn(ctx, 'fillText');

    renderTitle(ctx, 'Test Chart', 800);

    expect(fillTextSpy).toHaveBeenCalledWith('Test Chart', 400, 30);
  });

  it('should not render if title is empty', () => {
    const fillTextSpy = vi.spyOn(ctx, 'fillText');

    renderTitle(ctx, '', 800);

    expect(fillTextSpy).not.toHaveBeenCalled();
  });

  it('should not render if title is undefined', () => {
    const fillTextSpy = vi.spyOn(ctx, 'fillText');

    renderTitle(ctx, undefined, 800);

    expect(fillTextSpy).not.toHaveBeenCalled();
  });

  it('should use correct font settings', () => {
    renderTitle(ctx, 'Test Chart', 800);

    // Font should be set before rendering
    expect(ctx.font).toContain('bold');
    expect(ctx.font).toContain('18px');
  });

  it('should center title horizontally', () => {
    const fillTextSpy = vi.spyOn(ctx, 'fillText');
    vi.spyOn(ctx, 'measureText').mockReturnValue({ width: 200 } as TextMetrics);

    renderTitle(ctx, 'Wide Title Text', 800);

    // X position should be width / 2
    expect(fillTextSpy).toHaveBeenCalledWith('Wide Title Text', 400, 30);
  });

  it('should position title at consistent top margin', () => {
    const fillTextSpy = vi.spyOn(ctx, 'fillText');
    vi.spyOn(ctx, 'measureText').mockReturnValue({ width: 100 } as TextMetrics);

    renderTitle(ctx, 'Title', 800);

    // Y position should be 30px from top
    expect(fillTextSpy).toHaveBeenCalledWith('Title', 400, 30);
  });
});
