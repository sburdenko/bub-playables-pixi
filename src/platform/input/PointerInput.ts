import type { Vec2 } from '../../core/math/Vec2';
import type { IPointerSource, PointerSample } from '../../game/ports/IPointerSource';

type ToWorld = (screenX: number, screenY: number) => Vec2;

/**
 * Follows the first pointer (touch or mouse) on `element` and reports it once per frame, like Unity's
 * GetMouseButtonDown/Up: DOM events are only collected here, game logic runs in the frame update.
 */
export class PointerInput implements IPointerSource {
  private readonly _element: HTMLElement;
  private readonly _toWorld: ToWorld;
  private _activeId: number | null = null;
  private _screen = { x: 0, y: 0 };
  private _isPressed = false;
  private _isReleased = false;

  constructor(element: HTMLElement, toWorld: ToWorld) {
    this._element = element;
    this._toWorld = toWorld;
    element.addEventListener('pointerdown', this.onDown);
    element.addEventListener('pointermove', this.onMove);
    element.addEventListener('pointerup', this.onUp);
    element.addEventListener('pointercancel', this.onUp);
  }

  poll(): PointerSample | null {
    const isHeld = this._activeId !== null;
    if (!isHeld && !this._isPressed && !this._isReleased) {
      return null;
    }

    const sample = { world: this._toWorld(this._screen.x, this._screen.y), isPressedThisFrame: this._isPressed, isHeld, isReleasedThisFrame: this._isReleased };
    this._isPressed = false;
    this._isReleased = false;

    return sample;
  }

  dispose(): void {
    this._element.removeEventListener('pointerdown', this.onDown);
    this._element.removeEventListener('pointermove', this.onMove);
    this._element.removeEventListener('pointerup', this.onUp);
    this._element.removeEventListener('pointercancel', this.onUp);
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (this._activeId !== null) {
      return;
    }

    this._activeId = event.pointerId;
    this._isPressed = true;
    this.track(event);
    this._element.setPointerCapture(event.pointerId);
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (event.pointerId === this._activeId) {
      this.track(event);
    }
  };

  private readonly onUp = (event: PointerEvent): void => {
    if (event.pointerId === this._activeId) {
      this.track(event);
      this._activeId = null;
      this._isReleased = true;
    }
  };

  private track(event: PointerEvent): void {
    const bounds = this._element.getBoundingClientRect();
    this._screen = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
}
