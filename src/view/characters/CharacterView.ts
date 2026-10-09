import type { IRandom } from '../../core/random/IRandom';
import { currentFrame, playHit, restFlipbook, stepFlipbook, type FlipbookClip, type FlipbookState } from '../../domain/animation/Flipbook';
import type { ITextureSource } from '../assets/ITextureSource';
import { WorldSprite } from '../scene/WorldSprite';

export type CharacterDefinition = FlipbookClip & { readonly scale: number };

/** Shows the frame the character's flipbook is on. */
export class CharacterView extends WorldSprite {
  private readonly _definition: CharacterDefinition;
  private readonly _random: IRandom;
  private _state: FlipbookState;

  constructor(textures: ITextureSource, definition: CharacterDefinition, random: IRandom) {
    const state = restFlipbook(random);
    super(textures, currentFrame(state, definition));
    this._definition = definition;
    this._random = random;
    this._state = state;
    this.scale.set(definition.scale);
  }

  /** Half size in world units on the resting frame, used to pin the character to the screen corners. */
  get halfExtents(): { x: number; y: number } {
    return { x: (this.naturalWidth * this._definition.scale) / 2, y: (this.naturalHeight * this._definition.scale) / 2 };
  }

  playHit(): void {
    this.show(playHit(this._state, this._definition));
  }

  update(deltaSeconds: number): void {
    this.show(stepFlipbook(this._state, this._definition, deltaSeconds, this._random));
  }

  private show(state: FlipbookState): void {
    const frame = currentFrame(state, this._definition);
    if (frame !== currentFrame(this._state, this._definition)) {
      this.setTexture(frame);
    }

    this._state = state;
  }
}
