import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { length, normalize } from '../../../src/core/math/Vec2';
import { LauncherSystem } from '../../../src/game/launcher/LauncherSystem';
import { cancel, FakeBubbleView, FakeSling, hold, press, release } from './fakes';

const VISIBLE_RECT = rect(-3.79, -7.2, 7.58, 16.4);
const ANCHOR_Y = -7.2 + 16.4 * (700 / 2436);

function loadedLauncher() {
  const sling = new FakeSling();
  const launcher = new LauncherSystem(sling);
  const bubble = new FakeBubbleView('green');
  bubble.setLayoutScale(1);
  launcher.applyLayout(VISIBLE_RECT, 1);
  launcher.load(bubble);

  return { sling, launcher, bubble };
}

describe('LauncherSystem', () => {
  it('anchorsLowInTheVisibleAreaAndLoadsTheBubbleThere', () => {
    const { sling, launcher, bubble } = loadedLauncher();

    expect(launcher.anchor.x).toBeCloseTo(0, 10);
    expect(launcher.anchor.y).toBeCloseTo(ANCHOR_Y, 10);
    expect(sling.anchor).toEqual(launcher.anchor);
    expect(sling.aimColor).toBe('green');
    expect(bubble.position).toEqual(launcher.anchor);
    expect(launcher.isEmpty).toBe(false);
  });

  it('ignoresPressesAwayFromTheBubble', () => {
    const { launcher, bubble } = loadedLauncher();

    expect(launcher.update(press(2, ANCHOR_Y))).toBeNull();
    expect(launcher.update(hold(0, ANCHOR_Y - 0.5))).toBeNull();
    expect(bubble.position).toEqual(launcher.anchor);
  });

  it('pullingMovesTheBubbleAndShowsTheAim', () => {
    const { sling, launcher, bubble } = loadedLauncher();

    launcher.update(press(0, ANCHOR_Y));
    launcher.update(hold(0, ANCHOR_Y - 0.5));

    expect(bubble.position.y).toBeCloseTo(ANCHOR_Y - 0.5, 10);
    expect(sling.lastAim?.strength).toBeCloseTo(0.5 / 0.85, 10);
    expect(sling.lastAim?.aim.y).toBeGreaterThan(0);
  });

  it('grabsByWhereThePressStartedEvenIfTheFingerMovedInTheSameFrame', () => {
    const { launcher, bubble } = loadedLauncher();

    launcher.update({ world: { x: 0, y: ANCHOR_Y - 0.6 }, pressWorld: launcher.anchor, isPressedThisFrame: true, isHeld: true, isReleasedThisFrame: false, isCancelledThisFrame: false });

    expect(bubble.position.y).toBeCloseTo(ANCHOR_Y - 0.6, 10);
  });

  it('cancelledTouchPutsTheBubbleBackWithoutShooting', () => {
    const { sling, launcher, bubble } = loadedLauncher();

    launcher.update(press(0, ANCHOR_Y));
    launcher.update(hold(0, ANCHOR_Y - 0.6));

    expect(launcher.update(cancel(0, ANCHOR_Y - 0.6))).toBeNull();
    expect(bubble.position).toEqual(launcher.anchor);
    expect(sling.calls.at(-1)).toBe('loaded');
    expect(launcher.isEmpty).toBe(false);
  });

  it('shortPullReleasesBackToReady', () => {
    const { sling, launcher, bubble } = loadedLauncher();

    launcher.update(press(0, ANCHOR_Y));
    expect(launcher.update(release(0, ANCHOR_Y - 0.1))).toBeNull();

    expect(bubble.position).toEqual(launcher.anchor);
    expect(sling.calls.at(-1)).toBe('loaded');
    expect(launcher.isEmpty).toBe(false);
  });

  it('longPullShootsOppositeAtLaunchSpeed', () => {
    const { sling, launcher, bubble } = loadedLauncher();

    launcher.update(press(0, ANCHOR_Y));
    launcher.update(hold(-0.3, ANCHOR_Y - 0.6));
    const shot = launcher.update(release(-0.3, ANCHOR_Y - 0.6));

    expect(shot?.bubble).toBe(bubble);
    expect(shot?.position).toEqual(launcher.anchor);
    expect(length(shot?.velocity ?? { x: 0, y: 0 })).toBeCloseTo(12, 10);
    expect(normalize(shot?.velocity ?? { x: 0, y: 0 }).x).toBeGreaterThan(0);
    expect(sling.calls.at(-1)).toBe('release');
    expect(launcher.isEmpty).toBe(true);
  });

  it('relayoutKeepsTheLoadedBubbleOnTheAnchor', () => {
    const { launcher, bubble } = loadedLauncher();

    launcher.applyLayout(rect(-3.79, -9, 7.58, 20), 1.2);

    expect(bubble.position).toEqual(launcher.anchor);
    expect(bubble.layoutScale).toBe(1.2);
  });
});
