import { randomRange, type IRandom } from '../../core/random/IRandom';
import { pingPongFrame, pingPongStepCount } from './PingPong';

const MIN_REST_SECONDS = 3;
const MAX_REST_SECONDS = 5;

export type FlipbookClip = {
  readonly idleFrames: readonly string[];
  readonly hitFrames: readonly string[];
  readonly frameDuration: number;
};

/** Resting shows the first idle frame; playing walks `frames` forth and back. */
export type FlipbookState =
  | { readonly kind: 'resting'; readonly timer: number }
  | { readonly kind: 'playing'; readonly frames: readonly string[]; readonly step: number; readonly timer: number };

export function restFlipbook(random: IRandom): FlipbookState {
  return { kind: 'resting', timer: randomRange(random, MIN_REST_SECONDS, MAX_REST_SECONDS) };
}

/** Rests for a random pause, then plays the idle frames forth and back, then rests again. */
export function stepFlipbook(state: FlipbookState, clip: FlipbookClip, deltaSeconds: number, random: IRandom): FlipbookState {
  const timer = state.timer - deltaSeconds;
  if (timer > 0) {
    return { ...state, timer };
  }

  if (state.kind === 'resting') {
    return play(clip.idleFrames, clip);
  }

  const step = state.step + 1;

  return step >= pingPongStepCount(state.frames.length) ? restFlipbook(random) : { ...state, step, timer: clip.frameDuration };
}

/** Interrupts whatever is showing with the hit frames; clips without hit frames are unaffected. */
export function playHit(state: FlipbookState, clip: FlipbookClip): FlipbookState {
  return clip.hitFrames.length > 0 ? play(clip.hitFrames, clip) : state;
}

export function currentFrame(state: FlipbookState, clip: FlipbookClip): string {
  const frames = state.kind === 'playing' ? state.frames : clip.idleFrames;
  const index = state.kind === 'playing' ? pingPongFrame(state.step, frames.length) : 0;
  const frame = frames[index];
  if (frame === undefined) {
    throw new Error('A flipbook clip needs at least one idle frame.');
  }

  return frame;
}

function play(frames: readonly string[], clip: FlipbookClip): FlipbookState {
  return { kind: 'playing', frames, step: 0, timer: clip.frameDuration };
}
