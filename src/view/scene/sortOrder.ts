const LAYER_STRIDE = 100_000;

/** Draw order with Unity semantics: the `top` layer is always above `default`, then `order` within a layer. */
export function sortOrder(order: number, layer: 'default' | 'top' = 'default'): number {
  return (layer === 'top' ? LAYER_STRIDE : 0) + order;
}
