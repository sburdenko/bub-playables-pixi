/** How long a round lasts and how the end is paced. */
export type RoundRules = {
  readonly durationSeconds: number;
  /** After the time is up the end card waits this long, so the last shot or attack can land. */
  readonly endDelaySeconds: number;
};

export type BoardRules = {
  /** A landed bubble matches when its same-coloured group is at least this big. */
  readonly minMatchSize: number;
  readonly projectileAcceleration: number;
};

export type LauncherRules = {
  readonly maxPullDistance: number;
  /** Share of the maximum pull below which a release does not shoot. */
  readonly minPullShare: number;
  readonly maxLaunchAngleDegrees: number;
  readonly launchSpeed: number;
  /** How far from the loaded bubble a touch may land and still grab it, in bubble radii. */
  readonly grabRadiusFactor: number;
};

export type AttackRules = {
  readonly scorePerBubble: number;
};

/** When the timer bar leaves green: shares of the round that must have passed, and how long each colour fade takes. */
export type TimerTintSchedule = {
  readonly orangeFromShare: number;
  readonly redFromShare: number;
  readonly fadeSeconds: number;
};

/** Every number a designer is likely to tune, in one place. Systems get their own section through the constructor. */
export type GameConfig = {
  readonly round: RoundRules;
  readonly board: BoardRules;
  readonly launcher: LauncherRules;
  readonly attack: AttackRules;
  readonly timerTint: TimerTintSchedule;
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  round: { durationSeconds: 30, endDelaySeconds: 1.5 },
  board: { minMatchSize: 5, projectileAcceleration: 14 },
  launcher: { maxPullDistance: 0.85, minPullShare: 0.3, maxLaunchAngleDegrees: 40, launchSpeed: 12, grabRadiusFactor: 1.8 },
  attack: { scorePerBubble: 5 },
  timerTint: { orangeFromShare: 0.5, redFromShare: 0.8, fadeSeconds: 2 },
};

export function withRoundDuration(config: GameConfig, durationSeconds: number): GameConfig {
  return { ...config, round: { ...config.round, durationSeconds } };
}
