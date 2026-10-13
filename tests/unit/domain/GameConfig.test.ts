import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_CONFIG, withRoundDuration } from '../../../src/domain/config/GameConfig';

describe('GameConfig', () => {
  it('defaultsAreUsableNumbers', () => {
    const { round, board, launcher, attack, timerTint } = DEFAULT_GAME_CONFIG;

    for (const value of [round.durationSeconds, round.endDelaySeconds, board.minMatchSize, board.projectileAcceleration, launcher.launchSpeed, launcher.maxPullDistance, attack.scorePerBubble, timerTint.fadeSeconds]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it('timerTurnsOrangeBeforeRed', () => {
    const { orangeFromShare, redFromShare } = DEFAULT_GAME_CONFIG.timerTint;

    expect(orangeFromShare).toBeGreaterThan(0);
    expect(redFromShare).toBeGreaterThan(orangeFromShare);
    expect(redFromShare).toBeLessThan(1);
  });

  it('changingTheRoundReturnsANewConfigAndKeepsTheRest', () => {
    const longer = withRoundDuration(DEFAULT_GAME_CONFIG, 45);

    expect(longer.round.durationSeconds).toBe(45);
    expect(longer.round.endDelaySeconds).toBe(DEFAULT_GAME_CONFIG.round.endDelaySeconds);
    expect(longer.board).toBe(DEFAULT_GAME_CONFIG.board);
    expect(DEFAULT_GAME_CONFIG.round.durationSeconds).toBe(30);
  });
});
