(() => {
  const BASE_MAX_BALL_SPEED = 8;
  const LATE_ROUND_START = 5;
  const LATE_ROUND_MAX_SPEED_STEP = 0.2;
  const HARD_MAX_BALL_SPEED = 9;
  const ELITE_ROUND_SPEED_BONUS = 0.5;

  let eliteRoundActive = false;

  function baseMaxBallSpeedForRound(round = 1) {
    const safeRound = Number.isFinite(round)
      ? Math.max(1, Math.floor(round))
      : 1;
    const lateRoundSteps = Math.max(0, safeRound - LATE_ROUND_START);

    return Math.min(
      HARD_MAX_BALL_SPEED,
      BASE_MAX_BALL_SPEED + lateRoundSteps * LATE_ROUND_MAX_SPEED_STEP
    );
  }

  function maxBallSpeedForRound(round = 1) {
    return baseMaxBallSpeedForRound(round) + (eliteRoundActive ? ELITE_ROUND_SPEED_BONUS : 0);
  }

  function setEliteRoundActive(active) {
    eliteRoundActive = Boolean(active);
  }

  window.GameDifficulty = Object.freeze({
    maxBallSpeedForRound,
    baseMaxBallSpeedForRound,
    setEliteRoundActive,
    isEliteRoundActive: () => eliteRoundActive,
    eliteRoundSpeedBonus: ELITE_ROUND_SPEED_BONUS
  });
})();
