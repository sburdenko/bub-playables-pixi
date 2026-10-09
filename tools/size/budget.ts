/** Hard limit for one playable HTML file (docs/SPEC.md §7.1). Most ad networks cap at 5 MB; this keeps a margin. */
export const HTML_BUDGET_BYTES = 4.5 * 1024 * 1024;

/** Soft per-group targets from docs/SPEC.md §7.1, in KB of encoded files (before base64). */
export const ASSET_GROUP_BUDGETS_KB: Readonly<Record<string, number>> = {
  hero: 400,
  enemy: 500,
  bubbles: 650,
  background: 250,
  ui: 150,
  frame: 50,
  vfx: 100,
  font: 100,
};

export function base64Size(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}
