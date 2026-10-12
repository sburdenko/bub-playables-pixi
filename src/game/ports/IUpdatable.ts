/** Anything that advances once per frame. */
export interface IUpdatable {
  update(deltaSeconds: number): void;
}
