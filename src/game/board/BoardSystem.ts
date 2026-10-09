import type { Rect } from '../../core/math/Rect';
import { length, normalize, type Vec2 } from '../../core/math/Vec2';
import type { IRandom } from '../../core/random/IRandom';
import { BoardGeometry } from '../../domain/board/BoardGeometry';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import { cell, cellKey, type GridCell } from '../../domain/board/GridCell';
import { computeRipple } from '../../domain/board/ImpactRipple';
import { findMatch } from '../../domain/board/MatchRule';
import { pickProjectileColor } from '../../domain/board/ProjectileColorRule';
import { levelRowWidths, type Level } from '../../domain/level/Level';
import { isTouching } from '../../domain/physics/ContactRule';
import { stepProjectile, type ProjectileState } from '../../domain/physics/ProjectileMotion';
import type { IBubbleView, IBubbleViewFactory } from '../ports/IBubbleView';

export type PlacedBubble = { readonly cell: GridCell; readonly view: IBubbleView };

/** How a shot ended: where it landed (null when the board was full) and the bubbles it matched, now off the board. */
export type Settlement = { readonly landedAt: GridCell | null; readonly matched: readonly IBubbleView[] };

type Flight = { readonly bubble: IBubbleView; readonly motion: ProjectileState };

/** A shot never moves more than this fraction of its radius between contact checks, so it cannot tunnel at low frame rates. */
const MAX_STEP_IN_RADII = 0.5;

/** Owns the bubbles on the board and the one in flight; lands shots on the grid and finds matches. */
export class BoardSystem {
  private readonly _rowWidths: readonly number[];
  private readonly _factory: IBubbleViewFactory;
  private readonly _bubbles = new Map<string, PlacedBubble>();
  private _geometry: BoardGeometry;
  private _flight: Flight | null = null;

  constructor(level: Level, factory: IBubbleViewFactory, designRect: Rect) {
    this._rowWidths = levelRowWidths(level);
    this._factory = factory;
    this._geometry = new BoardGeometry(this._rowWidths, designRect);
    level.rows.forEach((row, rowIndex) => row.forEach((color, column) => color !== null && this.add(cell(rowIndex, column), this.create(color))));
  }

  get geometry(): BoardGeometry {
    return this._geometry;
  }

  get bubbles(): readonly PlacedBubble[] {
    return [...this._bubbles.values()];
  }

  colorAt(target: GridCell): BubbleColor | undefined {
    return this._bubbles.get(cellKey(target))?.view.color;
  }

  applyLayout(designRect: Rect): void {
    this._geometry = new BoardGeometry(this._rowWidths, designRect);
    for (const bubble of this._bubbles.values()) {
      bubble.view.setLayoutScale(this._geometry.scale);
      bubble.view.setRestPosition(this._geometry.cellPosition(bubble.cell));
    }

    this._flight?.bubble.setLayoutScale(this._geometry.scale);
  }

  /** A new shot in a colour still on the board. */
  createProjectile(random: IRandom): IBubbleView {
    return this.create(pickProjectileColor(this.bubbles.map((bubble) => bubble.view.color), random));
  }

  launch(bubble: IBubbleView, position: Vec2, velocity: Vec2): void {
    this._flight = { bubble, motion: { position, velocity } };
    bubble.playLaunch();
  }

  /** Moves the shot in flight; returns how it ended on the frame it lands. */
  update(deltaSeconds: number): Settlement | null {
    if (this._flight === null) {
      return null;
    }

    const { bubble } = this._flight;
    const radius = this._geometry.cellRadius;
    const walls = { leftX: this._geometry.leftWallX, rightX: this._geometry.rightWallX };
    const others = this.bubbles.map((placed) => ({ position: placed.view.position, radius }));
    const steps = Math.max(1, Math.ceil((length(this._flight.motion.velocity) * deltaSeconds) / (radius * MAX_STEP_IN_RADII)));
    let motion = this._flight.motion;
    for (let step = 0; step < steps; step++) {
      motion = stepProjectile(motion, deltaSeconds / steps, radius, walls);
      if (isTouching({ position: motion.position, radius }, this._geometry.topY, others)) {
        bubble.setPosition(motion.position);
        this._flight = null;

        return this.land(bubble, motion);
      }
    }

    bubble.setPosition(motion.position);
    this._flight = { bubble, motion };

    return null;
  }

  private land(bubble: IBubbleView, motion: ProjectileState): Settlement {
    const landedAt = this._geometry.findClosestCell(motion.position, (target) => !this._bubbles.has(cellKey(target)));
    if (landedAt === null) {
      bubble.destroy();

      return { landedAt: null, matched: [] };
    }

    this.add(landedAt, bubble);
    const isOccupied = (target: GridCell) => this._bubbles.has(cellKey(target));
    for (const impulse of computeRipple(this._geometry, isOccupied, landedAt, normalize(motion.velocity))) {
      this._bubbles.get(cellKey(impulse.cell))?.view.applyImpact(impulse.direction, impulse.strength);
    }

    const match = findMatch(this._geometry, (target) => this.colorAt(target), landedAt) ?? [];

    return { landedAt, matched: match.map((target) => this.remove(target)).filter((view) => view !== undefined) };
  }

  private create(color: BubbleColor): IBubbleView {
    const view = this._factory.create(color);
    view.setLayoutScale(this._geometry.scale);

    return view;
  }

  private add(target: GridCell, view: IBubbleView): void {
    view.place(this._geometry.cellPosition(target), target.row);
    this._bubbles.set(cellKey(target), { cell: target, view });
  }

  private remove(target: GridCell): IBubbleView | undefined {
    const view = this._bubbles.get(cellKey(target))?.view;
    this._bubbles.delete(cellKey(target));

    return view;
  }
}
