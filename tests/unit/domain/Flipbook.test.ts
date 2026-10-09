import { describe, expect, it } from 'vitest';
import { currentFrame, playHit, restFlipbook, stepFlipbook, type FlipbookClip, type FlipbookState } from '../../../src/domain/animation/Flipbook';

const CLIP: FlipbookClip = { idleFrames: ['i0', 'i1', 'i2'], hitFrames: ['h0', 'h1'], frameDuration: 0.1 };
const random = { next: () => 0.5 };

function run(state: FlipbookState, steps: number, deltaSeconds: number): { shown: string[]; last: FlipbookState } {
  const shown: string[] = [];
  let last = state;
  for (let index = 0; index < steps; index++) {
    last = stepFlipbook(last, CLIP, deltaSeconds, random);
    shown.push(currentFrame(last, CLIP));
  }

  return { shown, last };
}

describe('Flipbook', () => {
  it('restsOnTheFirstIdleFrameForARandomPause', () => {
    const state = restFlipbook(random);

    expect(state).toEqual({ kind: 'resting', timer: 4 });
    expect(currentFrame(state, CLIP)).toBe('i0');
    expect(stepFlipbook(state, CLIP, 1, random)).toEqual({ kind: 'resting', timer: 3 });
  });

  it('playsIdleForthAndBackThenRestsAgain', () => {
    const playing = stepFlipbook(restFlipbook(random), CLIP, 4, random);

    const { shown, last } = run(playing, 4, 0.1);

    expect(currentFrame(playing, CLIP)).toBe('i0');
    expect(shown).toEqual(['i1', 'i2', 'i1', 'i0']);
    expect(last.kind).toBe('resting');
  });

  it('hitInterruptsAndPlaysTheHitFrames', () => {
    const hit = playHit(restFlipbook(random), CLIP);

    expect(currentFrame(hit, CLIP)).toBe('h0');
    expect(run(hit, 2, 0.1).shown).toEqual(['h1', 'i0']);
  });

  it('clipWithoutHitFramesIgnoresHits', () => {
    const state = restFlipbook(random);

    expect(playHit(state, { ...CLIP, hitFrames: [] })).toBe(state);
  });

  it('clipWithoutIdleFramesFailsLoudly', () => {
    expect(() => currentFrame(restFlipbook(random), { ...CLIP, idleFrames: [] })).toThrow(/at least one idle frame/);
  });
});
