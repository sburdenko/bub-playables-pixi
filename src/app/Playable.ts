import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import type { BoardSystem } from '../game/board/BoardSystem';
import type { TurnFlow } from '../game/flow/TurnFlow';
import type { LauncherSystem } from '../game/launcher/LauncherSystem';
import type { IUpdatable } from '../game/ports/IUpdatable';
import type { IAdNetwork } from '../platform/ads/IAdNetwork';
import type { EndCardView } from '../view/endcard/EndCardView';
import type { TopBarView } from '../view/layout/TopBarView';
import type { SceneView } from '../view/scene/SceneView';
import type { UiStage } from '../view/ui/UiStage';

/** Everything the running game needs, already created and wired by `assemblePlayable`. */
export type PlayableParts = {
  readonly scene: SceneView;
  readonly ui: UiStage;
  readonly topBar: TopBarView;
  readonly board: BoardSystem;
  readonly launcher: LauncherSystem;
  readonly endCard: EndCardView;
  readonly turn: TurnFlow;
  readonly ads: IAdNetwork;
  /** Advanced once per frame, in this order: logic first, then the views. */
  readonly frame: readonly IUpdatable[];
};

/** The running game: advances its parts every frame, relays layout changes and shows the end card once the turn is over. */
export class Playable {
  private readonly _parts: PlayableParts;

  constructor(parts: PlayableParts) {
    this._parts = parts;
  }

  /** The world; add it to the stage first. */
  get scene(): SceneView {
    return this._parts.scene;
  }

  /** The screen-space interface; add it to the stage after the scene. */
  get ui(): UiStage {
    return this._parts.ui;
  }

  applyLayout(layout: ViewportLayout): void {
    const { scene, topBar, board, launcher, endCard } = this._parts;
    scene.applyLayout(layout);
    topBar.applyLayout(layout);
    board.applyLayout(layout.designRect);
    launcher.applyLayout(layout.visibleRect, board.layoutScale);
    endCard.applyLayout(layout);
  }

  update(deltaSeconds: number): void {
    const { frame, turn, endCard, ads } = this._parts;
    for (const part of frame) {
      part.update(deltaSeconds);
    }

    if (turn.state.kind === 'ended' && !endCard.isShown) {
      endCard.show();
      ads.notifyEnded();
    }
  }
}
