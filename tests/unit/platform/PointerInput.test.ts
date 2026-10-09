import { describe, expect, it } from 'vitest';
import { vec2 } from '../../../src/core/math/Vec2';
import { PointerInput } from '../../../src/platform/input/PointerInput';

type Handler = (event: PointerEvent) => void;

/** Just enough of an HTMLElement for PointerInput: listeners, bounds and pointer capture. */
class FakeElement {
  readonly handlers = new Map<string, Handler>();
  captured: number[] = [];

  addEventListener(type: string, handler: Handler): void {
    this.handlers.set(type, handler);
  }

  removeEventListener(type: string): void {
    this.handlers.delete(type);
  }

  getBoundingClientRect(): { left: number; top: number } {
    return { left: 10, top: 20 };
  }

  setPointerCapture(pointerId: number): void {
    this.captured.push(pointerId);
  }

  fire(type: string, pointerId: number, x: number, y: number): void {
    this.handlers.get(type)?.({ pointerId, clientX: x, clientY: y } as PointerEvent);
  }
}

function setUp() {
  const element = new FakeElement();
  const input = new PointerInput(element as unknown as HTMLElement, (x, y) => vec2(x, -y));

  return { element, input };
}

describe('PointerInput', () => {
  it('reportsNothingWithoutATouch', () => {
    expect(setUp().input.poll()).toBeNull();
  });

  it('reportsPressHoldAndReleaseOncePerFrameInElementSpace', () => {
    const { element, input } = setUp();

    element.fire('pointerdown', 1, 110, 220);
    expect(input.poll()).toEqual({ world: vec2(100, -200), pressWorld: vec2(100, -200), isPressedThisFrame: true, isHeld: true, isReleasedThisFrame: false, isCancelledThisFrame: false });
    element.fire('pointermove', 1, 130, 260);
    expect(input.poll()).toMatchObject({ world: vec2(120, -240), pressWorld: null, isPressedThisFrame: false, isHeld: true });
    element.fire('pointerup', 1, 130, 260);
    expect(input.poll()).toMatchObject({ isHeld: false, isReleasedThisFrame: true });
    expect(input.poll()).toBeNull();
    expect(element.captured).toEqual([1]);
  });

  it('keepsThePressPositionWhenThePressAndMovesLandInOneFrame', () => {
    const { element, input } = setUp();

    element.fire('pointerdown', 1, 110, 220);
    element.fire('pointermove', 1, 200, 400);

    expect(input.poll()).toMatchObject({ world: vec2(190, -380), pressWorld: vec2(100, -200), isPressedThisFrame: true });
  });

  it('followsOnlyTheFirstFinger', () => {
    const { element, input } = setUp();

    element.fire('pointerdown', 1, 30, 60);
    input.poll();
    element.fire('pointerdown', 2, 300, 300);
    element.fire('pointermove', 2, 310, 310);
    element.fire('pointerup', 2, 310, 310);

    expect(input.poll()).toMatchObject({ world: vec2(20, -40), isHeld: true, isReleasedThisFrame: false });
  });

  it('cancelOrLostCaptureIsNotARelease', () => {
    const { element, input } = setUp();

    element.fire('pointerdown', 1, 10, 20);
    input.poll();
    element.fire('pointercancel', 1, 10, 20);
    expect(input.poll()).toMatchObject({ isHeld: false, isReleasedThisFrame: false, isCancelledThisFrame: true });

    element.fire('pointerdown', 3, 10, 20);
    input.poll();
    element.fire('lostpointercapture', 3, 10, 20);
    expect(input.poll()).toMatchObject({ isCancelledThisFrame: true });
    expect(input.poll()).toBeNull();
  });

  it('disposeRemovesEveryListener', () => {
    const { element, input } = setUp();

    input.dispose();

    expect(element.handlers.size).toBe(0);
  });
});
