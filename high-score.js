(() => {
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  if (!scoreEl || !highScoreEl) return;

  const STORAGE_KEY = 'breakoutHighScore';

  function readStoredHighScore() {
    try {
      const value = Number.parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  let highScore = readStoredHighScore();
  highScoreEl.textContent = highScore;

  function syncHighScore() {
    const score = Number(scoreEl.textContent) || 0;
    if (score <= highScore) return;

    highScore = score;
    highScoreEl.textContent = highScore;
    try {
      localStorage.setItem(STORAGE_KEY, String(highScore));
    } catch {
      // The HUD still reflects the best score for this page session.
    }
  }

  new MutationObserver(syncHighScore).observe(scoreEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__HIGH_SCORE_DEBUG__ = {
    getHighScore() {
      return highScore;
    }
  };
})();
