import { vec2, ZERO, type Vec2 } from '../../../src/core/math/Vec2';
import type { BubbleColor } from '../../../src/domain/board/BubbleColor';
import type { IBubbleView, IBubbleViewFactory } from '../../../src/game/ports/IBubbleView';
import type { IPointerSource, PointerSample } from '../../../src/game/ports/IPointerSource';
import type { ISlingView } from '../../../src/game/ports/ISlingView';

export class FakeBubbleView implements IBubbleView {
  readonly color: BubbleColor;
  layoutScale = 0;
  position: Vec2 = ZERO;
  rest: Vec2 | null = null;
  row: number | null = null;
  spawnCount = 0;
  isLaunched = false;
  impacts: { direction: Vec2; strength: number }[] = [];
  isDestroyed = false;
  events: string[] = [];
  rotation = 0;
  shrink = 1;

  constructor(color: BubbleColor) {
    this.color = color;
  }

  setLayoutScale(scale: number): void {
    this.layoutScale = scale;
  }

  setPosition(position: Vec2): void {
    this.position = position;
  }

  playLaunch(): void {
    this.isLaunched = true;
  }

  place(rest: Vec2, row: number): void {
    this.rest = rest;
    this.position = rest;
    this.row = row;
    this.spawnCount++;
  }

  setRestPosition(rest: Vec2): void {
    this.rest = rest;
    this.position = rest;
  }

  applyImpact(direction: Vec2, strength: number): void {
    this.impacts.push({ direction, strength });
  }

  playMatch(): void {
    this.events.push('match');
  }

  beginCollect(): void {
    this.events.push('collect');
  }

  stopAnimation(): void {
    this.events.push('stop');
  }

  rotateBy(radians: number): void {
    this.rotation += radians;
  }

  setShrink(factor: number): void {
    this.shrink = factor;
  }

  destroy(): void {
    this.isDestroyed = true;
  }
}

export class FakeFactory implements IBubbleViewFactory {
  readonly created: FakeBubbleView[] = [];

  create(color: BubbleColor): FakeBubbleView {
    const view = new FakeBubbleView(color);
    this.created.push(view);

    return view;
  }
}

export class FakeSling implements ISlingView {
  anchor: Vec2 = ZERO;
  aimColor: BubbleColor | null = null;
  calls: string[] = [];
  lastAim: { pocket: Vec2; aim: Vec2; strength: number } | null = null;

  setAnchor(anchor: Vec2): void {
    this.anchor = anchor;
  }

  setAimColor(color: BubbleColor): void {
    this.aimColor = color;
  }

  showLoaded(): void {
    this.calls.push('loaded');
  }

  showAim(pocket: Vec2, aim: Vec2, strength: number): void {
    this.calls.push('aim');
    this.lastAim = { pocket, aim, strength };
  }

  release(): void {
    this.calls.push('release');
  }
}

/** Pointer driven by a script of samples, one per frame. */
export class ScriptedPointer implements IPointerSource {
  private readonly _frames: (PointerSample | null)[];

  constructor(frames: (PointerSample | null)[]) {
    this._frames = frames;
  }

  poll(): PointerSample | null {
    return this._frames.shift() ?? null;
  }
}

export function press(x: number, y: number): PointerSample {
  return { world: vec2(x, y), pressWorld: vec2(x, y), isPressedThisFrame: true, isHeld: true, isReleasedThisFrame: false, isCancelledThisFrame: false };
}

export function hold(x: number, y: number): PointerSample {
  return { world: vec2(x, y), pressWorld: null, isPressedThisFrame: false, isHeld: true, isReleasedThisFrame: false, isCancelledThisFrame: false };
}

export function release(x: number, y: number): PointerSample {
  return { world: vec2(x, y), pressWorld: null, isPressedThisFrame: false, isHeld: false, isReleasedThisFrame: true, isCancelledThisFrame: false };
}

export function cancel(x: number, y: number): PointerSample {
  return { world: vec2(x, y), pressWorld: null, isPressedThisFrame: false, isHeld: false, isReleasedThisFrame: false, isCancelledThisFrame: true };
}
