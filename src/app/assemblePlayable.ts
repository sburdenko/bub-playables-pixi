import type { IRandom } from '../core/random/IRandom';
import type { GameConfig } from '../domain/config/GameConfig';
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
import { TopBarView } from '../view/layout/TopBarView';
import { SlingView } from '../view/launcher/SlingView';
import { SceneView } from '../view/scene/SceneView';
import { UiStage } from '../view/ui/UiStage';
import { EffectsLayer } from '../view/vfx/EffectsLayer';
import { Playable } from './Playable';

/** Creates every part of the playable and decides who talks to whom; the running game lives in `Playable`. */
export function assemblePlayable(
  textures: ITextureSource,
  random: IRandom,
  pointer: IPointerSource,
  layout: ViewportLayout,
  ads: IAdNetwork,
  config: GameConfig,
): Playable {
  const scene = new SceneView(textures, random);
  const effects = new EffectsLayer(textures, scene.layers, random);
  const bubbles = new BubbleLayer(textures, scene.layers, effects);
  const sling = new SlingView(textures);
  const orb = new OrbView(textures);
  const topBar = new TopBarView(textures);
  const endCard = new EndCardView(textures, () => ads.openStore());
  const ui = new UiStage();
  ui.hud.addChild(topBar);
  ui.overlay.addChild(endCard);
  scene.layers.gameplay.addChild(...sling.parts);
  scene.layers.foreground.addChild(orb);

  const board = new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), bubbles, layout.designRect, config.board);
  const launcher = new LauncherSystem(sling, config.launcher);
  const attack = new MatchAttackSequence(orb, scene.bottom.enemy, effects, config.attack);
  const timer = new RoundTimer(config.round.durationSeconds, topBar, config.timerTint);
  const turn = new TurnFlow(board, launcher, attack, pointer, random, timer, config.round.endDelaySeconds);

  const playable = new Playable({
    scene,
    ui,
    topBar,
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
