import { Container } from 'pixi.js';

/**
 * Back-to-front containers of the world. Inside `gameplay` and `foreground` objects sort by `zIndex`; between the
 * layers the order is fixed by the container order, never by a number.
 */
export type WorldLayers = {
  readonly background: Container;
  /** Scenery, characters, bubbles at rest, the sling and the particle effects that sit among them. */
  readonly gameplay: Container;
  /** What flies above the frame: collected bubbles, the attack orb and floating numbers. */
  readonly foreground: Container;
};

export function createWorldLayers(): WorldLayers {
  return {
    background: new Container(),
    gameplay: new Container({ sortableChildren: true }),
    foreground: new Container({ sortableChildren: true }),
  };
}
