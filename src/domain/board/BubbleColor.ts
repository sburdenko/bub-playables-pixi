export const BUBBLE_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

export type BubbleColor = (typeof BUBBLE_COLORS)[number];
