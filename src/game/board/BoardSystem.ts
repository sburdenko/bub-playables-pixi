import type { Rect } from '../../core/math/Rect';
import { BoardGeometry } from '../../domain/board/BoardGeometry';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import { cell, cellKey, type GridCell } from '../../domain/board/GridCell';
import { levelRowWidths, type Level } from '../../domain/level/Level';
import type { IBubbleView, IBubbleViewFactory } from '../ports/IBubbleView';

export type PlacedBubble = { readonly cell: GridCell; readonly view: IBubbleView };

/** Owns the bubbles placed on the board and keeps them on their cells when the layout changes. */
export class BoardSystem {
  private readonly _rowWidths: readonly number[];
  private readonly _factory: IBubbleViewFactory;
  private readonly _bubbles = new Map<string, PlacedBubble>();
  private _geometry: BoardGeometry;

  constructor(level: Level, factory: IBubbleViewFactory, designRect: Rect) {
    this._rowWidths = levelRowWidths(level);
    this._factory = factory;
    this._geometry = new BoardGeometry(this._rowWidths, designRect);
    level.rows.forEach((row, rowIndex) =>
      row.forEach((color, column) => color !== null && this.spawn(cell(rowIndex, column), color)),
    );
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
  }

  private spawn(target: GridCell, color: BubbleColor): void {
    const view = this._factory.create(color);
    view.setLayoutScale(this._geometry.scale);
    view.place(this._geometry.cellPosition(target), target.row);
    this._bubbles.set(cellKey(target), { cell: target, view });
  }
}
