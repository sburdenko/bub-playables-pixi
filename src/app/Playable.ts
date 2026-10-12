import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import type { BoardSystem } from '../game/board/BoardSystem';
import type { TurnFlow } from '../game/flow/TurnFlow';
import type { LauncherSystem } from '../game/launcher/LauncherSystem';
import type { IUpdatable } from '../game/ports/IUpdatable';
import type { IAdNetwork } from '../platform/ads/IAdNetwork';
import type { EndCardView } from '../view/endcard/EndCardView';
import type { SceneView } from '../view/scene/SceneView';

/** Everything the running game needs, already created and wired by `assemblePlayable`. */
export type PlayableParts = {
  readonly scene: SceneView;
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

  get scene(): SceneView {
    return this._parts.scene;
  }

  applyLayout(layout: ViewportLayout): void {
    const { scene, board, launcher, endCard } = this._parts;
    scene.applyLayout(layout);
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
