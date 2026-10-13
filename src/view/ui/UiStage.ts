import { Container } from 'pixi.js';

/**
 * Root of everything drawn in screen pixels, on top of the world and independent of its camera: the timer bar in
 * `hud` and the end card in `overlay`. Children are placed from the viewport in screen space (Y down).
 */
export class UiStage extends Container {
  readonly hud = new Container();
  readonly overlay = new Container();

  constructor() {
    super();
    this.addChild(this.hud, this.overlay);
  }
}
