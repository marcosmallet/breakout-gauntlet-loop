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
  let previousScore = Number(scoreEl.textContent) || 0;
  let recordToBeat = highScore;
  let celebratedThisRun = false;
  let celebrationCount = 0;
  highScoreEl.textContent = highScore;

  function celebrateNewRecord() {
    celebrationCount += 1;
    highScoreEl.animate(
      [
        { transform: 'scale(1)', textShadow: 'none' },
        { transform: 'scale(1.55)', textShadow: '0 0 18px #facc15' },
        { transform: 'scale(1)', textShadow: 'none' }
      ],
      { duration: 520, easing: 'ease-out' }
    );
  }

  function syncHighScore() {
    const score = Number(scoreEl.textContent) || 0;

    if (score < previousScore) {
      recordToBeat = highScore;
      celebratedThisRun = false;
    }

    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      try {
        localStorage.setItem(STORAGE_KEY, String(highScore));
      } catch {
        // The HUD still reflects the best score for this page session.
      }
    }

    if (
      recordToBeat > 0 &&
      score > recordToBeat &&
      !celebratedThisRun
    ) {
      celebratedThisRun = true;
      celebrateNewRecord();
    }

    previousScore = score;
  }

  new MutationObserver(syncHighScore).observe(scoreEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__HIGH_SCORE_DEBUG__ = {
    getHighScore() {
      return highScore;
    },
    getCelebrationCount() {
      return celebrationCount;
    }
  };
})();
