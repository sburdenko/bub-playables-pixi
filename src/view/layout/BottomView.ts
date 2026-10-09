import type { Container } from 'pixi.js';
import type { IRandom } from '../../core/random/IRandom';
import { centerX, xMax } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { CharacterView } from '../characters/CharacterView';
import { ENEMY, HERO } from '../characters/characters';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';

const PANEL_SORT_ORDER = -1;
const CHARACTER_SORT_ORDER = 0;
/** Unity scales the panel object by 1.15 on top of its computed size; kept for parity. */
const PANEL_OBJECT_SCALE = 1.15;
const HERO_INSET = { x: 0.35, y: 0.78 };
const ENEMY_INSET = { x: 0.3, y: 0.82 };

/** Bottom panel pinned to the screen bottom, hero and enemy pinned to the bottom corners of the design area. */
export class BottomView {
  readonly hero: CharacterView;
  readonly enemy: CharacterView;
  private readonly _panel: WorldSprite;

  constructor(textures: ITextureSource, random: IRandom) {
    this._panel = new WorldSprite(textures, 'gameplaybottomblue');
    this.hero = new CharacterView(textures, HERO, random);
    this.enemy = new CharacterView(textures, ENEMY, random);
    this._panel.zIndex = sortOrder(PANEL_SORT_ORDER);
    this.hero.zIndex = sortOrder(CHARACTER_SORT_ORDER);
    this.enemy.zIndex = sortOrder(CHARACTER_SORT_ORDER);
  }

  /** The panel and characters join the world directly so they sort against everything else. */
  get parts(): readonly Container[] {
    return [this._panel, this.hero, this.enemy];
  }

  applyLayout({ visibleRect, designRect }: ViewportLayout): void {
    const screenBottom = visibleRect.yMin;
    const panelHeight = (designRect.width * this._panel.naturalHeight) / this._panel.naturalWidth;
    this._panel.setWorldSize(visibleRect.width * PANEL_OBJECT_SCALE, panelHeight * PANEL_OBJECT_SCALE);
    this._panel.position.set(centerX(visibleRect), screenBottom + panelHeight / 2);

    const hero = this.hero.halfExtents;
    this.hero.position.set(designRect.xMin + hero.x + HERO_INSET.x, screenBottom + hero.y + HERO_INSET.y);
    const enemy = this.enemy.halfExtents;
    this.enemy.position.set(xMax(designRect) - enemy.x - ENEMY_INSET.x, screenBottom + enemy.y + ENEMY_INSET.y);
  }

  update(deltaSeconds: number): void {
    this.hero.update(deltaSeconds);
    this.enemy.update(deltaSeconds);
  }
}
