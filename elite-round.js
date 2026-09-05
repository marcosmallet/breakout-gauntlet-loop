(() => {
  const roundEl = document.getElementById('round');
  const livesEl = document.getElementById('lives');
  const roundModeEl = document.getElementById('roundMode');
  const canvas = document.getElementById('game');
  if (!roundEl || !livesEl || !roundModeEl || !window.GameDifficulty) return;

  const ELITE_START_ROUND = 6;
  const MAX_LIVES = 5;

  let trackedRound = Number.parseInt(roundEl.textContent, 10) || 1;
  let livesAtRoundStart = Number.parseInt(livesEl.textContent, 10) || 3;
  let minimumLivesThisRound = livesAtRoundStart;
  let eliteRoundActive = false;

  function renderMode() {
    roundModeEl.textContent = eliteRoundActive ? 'Elite' : 'Normal';
    roundModeEl.dataset.elite = String(eliteRoundActive);
    if (canvas) canvas.dataset.eliteRound = String(eliteRoundActive);
  }

  function setEliteRound(active) {
    eliteRoundActive = Boolean(active);
    window.GameDifficulty.setEliteRoundActive(eliteRoundActive);
    renderMode();
  }

  function resetTracking(round, lives) {
    trackedRound = round;
    livesAtRoundStart = lives;
    minimumLivesThisRound = lives;
    setEliteRound(false);
  }

  new MutationObserver(() => {
    const lives = Number.parseInt(livesEl.textContent, 10);
    if (!Number.isInteger(lives)) return;
    minimumLivesThisRound = Math.min(minimumLivesThisRound, lives);
  }).observe(livesEl, { childList: true, characterData: true, subtree: true });

  new MutationObserver(() => {
    const nextRound = Number.parseInt(roundEl.textContent, 10);
    const currentLives = Number.parseInt(livesEl.textContent, 10);
    if (!Number.isInteger(nextRound) || !Number.isInteger(currentLives)) return;

    if (nextRound <= trackedRound) {
      if (nextRound < trackedRound || nextRound === 1) resetTracking(nextRound, currentLives);
      return;
    }

    const sustainedMastery = livesAtRoundStart >= MAX_LIVES && minimumLivesThisRound >= MAX_LIVES;
    setEliteRound(nextRound >= ELITE_START_ROUND && sustainedMastery);

    trackedRound = nextRound;
    livesAtRoundStart = currentLives;
    minimumLivesThisRound = currentLives;
  }).observe(roundEl, { childList: true, characterData: true, subtree: true });

  setEliteRound(false);

  window.__ELITE_ROUND_DEBUG__ = {
    getState() {
      return {
        active: eliteRoundActive,
        trackedRound,
        livesAtRoundStart,
        minimumLivesThisRound,
        startRound: ELITE_START_ROUND
      };
    }
  };
})();
