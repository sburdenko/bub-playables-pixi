import { Container, Sprite, Text } from 'pixi.js';
import type { ITextureSource } from '../view/assets/ITextureSource';

const BACKGROUND_ID = 'background';
const HERO_FRAME_ID = 'smash2';
const ENEMY_FRAME_ID = 'gizmo1';

/**
 * Proves the P0 pipeline end to end (manifest → loader → textures on screen). P2 replaces it with the real
 * scene laid out by the ported viewport math.
 */
export class ScaffoldScene extends Container {
  private readonly _background: Sprite;
  private readonly _hero: Sprite;
  private readonly _enemy: Sprite;
  private readonly _label: Text;

  constructor(textures: ITextureSource) {
    super();
    this._background = new Sprite(textures.get(BACKGROUND_ID));
    this._hero = new Sprite(textures.get(HERO_FRAME_ID));
    this._enemy = new Sprite(textures.get(ENEMY_FRAME_ID));
    this._label = new Text({
      text: `P0 · ${textures.ids.length} sprites loaded`,
      style: { fontFamily: 'Comic Roasting', fontSize: 64, fill: 0xffffff, stroke: { color: 0x1a0a00, width: 8 } },
      anchor: 0.5,
    });
    this.addChild(this._background, this._hero, this._enemy, this._label);
  }

  layout(width: number, height: number): void {
    const cover = Math.max(width / this._background.texture.width, height / this._background.texture.height);
    this._background.scale.set(cover);
    this._background.position.set(width / 2, height / 2);

    const characterHeight = height * 0.18;
    for (const [sprite, x] of [[this._hero, 0.25], [this._enemy, 0.75]] as const) {
      sprite.scale.set(characterHeight / sprite.texture.height);
      sprite.position.set(width * x, height - characterHeight * 0.7);
    }

    this._label.scale.set(Math.min(1, (width * 0.9) / (this._label.width / this._label.scale.x)));
    this._label.position.set(width / 2, height * 0.15);
  }
}
