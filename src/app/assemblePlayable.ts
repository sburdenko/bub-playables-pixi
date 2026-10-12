import type { IRandom } from '../core/random/IRandom';
import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import { parseLevel } from '../domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../domain/level/openingLevel';
import { MatchAttackSequence } from '../game/attack/MatchAttackSequence';
import { BoardSystem } from '../game/board/BoardSystem';
import { RoundTimer } from '../game/flow/RoundTimer';
import { TurnFlow } from '../game/flow/TurnFlow';
import { LauncherSystem } from '../game/launcher/LauncherSystem';
import type { IPointerSource } from '../game/ports/IPointerSource';
import type { IAdNetwork } from '../platform/ads/IAdNetwork';
import type { ITextureSource } from '../view/assets/ITextureSource';
import { OrbView } from '../view/attack/OrbView';
import { BubbleLayer } from '../view/bubble/BubbleLayer';
import { EndCardView } from '../view/endcard/EndCardView';
import { SlingView } from '../view/launcher/SlingView';
import { SceneView } from '../view/scene/SceneView';
import { EffectsLayer } from '../view/vfx/EffectsLayer';
import { Playable } from './Playable';

/** After the time is up the end card waits this long, so the last shot or attack can land. */
const END_DELAY_SECONDS = 1.5;

/** Creates every part of the playable and decides who talks to whom; the running game lives in `Playable`. */
export function assemblePlayable(
  textures: ITextureSource,
  random: IRandom,
  pointer: IPointerSource,
  layout: ViewportLayout,
  ads: IAdNetwork,
  roundSeconds: number,
): Playable {
  const scene = new SceneView(textures, random);
  const effects = new EffectsLayer(textures, scene.world, random);
  const bubbles = new BubbleLayer(textures, scene.world, effects);
  const sling = new SlingView(textures);
  const orb = new OrbView(textures);
  const endCard = new EndCardView(textures, () => ads.openStore());
  scene.world.addChild(...sling.parts, orb, endCard);

  const board = new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), bubbles, layout.designRect);
  const launcher = new LauncherSystem(sling);
  const attack = new MatchAttackSequence(orb, scene.bottom.enemy, effects);
  const timer = new RoundTimer(roundSeconds, scene.timer);
  const turn = new TurnFlow(board, launcher, attack, pointer, random, timer, END_DELAY_SECONDS);

  const playable = new Playable({
    scene,
    board,
    launcher,
    endCard,
    turn,
    ads,
    frame: [timer, turn, scene, sling, bubbles, effects, endCard],
  });
  playable.applyLayout(layout);

  return playable;
}
