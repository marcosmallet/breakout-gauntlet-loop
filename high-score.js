(() => {
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const bestRoundEl = document.getElementById('bestRound');
  const roundEl = document.getElementById('round');
  const startButton = document.getElementById('startButton');
  if (!scoreEl || !highScoreEl || !bestRoundEl || !roundEl || !startButton) return;

  const SCORE_STORAGE_KEY = 'breakoutHighScore';
  const ROUND_STORAGE_KEY = 'breakoutBestRound';

  function readStoredPositiveInteger(key) {
    try {
      const value = Number.parseInt(localStorage.getItem(key) || '0', 10);
      return Number.isInteger(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  let highScore = readStoredPositiveInteger(SCORE_STORAGE_KEY);
  let bestRound = readStoredPositiveInteger(ROUND_STORAGE_KEY);
  let previousScore = Number(scoreEl.textContent) || 0;
  let recordToBeat = highScore;
  let bestRoundToBeat = bestRound;
  let celebratedThisRun = false;
  let celebratedBestRoundThisRun = false;
  let celebrationCount = 0;
  let bestRoundCelebrationCount = 0;
  let trackingRun = false;
  highScoreEl.textContent = highScore;
  bestRoundEl.textContent = bestRound > 0 ? String(bestRound) : '—';

  function persistPositiveInteger(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Keep the record visible for this page session when storage is unavailable.
    }
  }

  function animateRecord(element) {
    if (prefersReducedMotion()) return false;

    element.animate(
      [
        { transform: 'scale(1)', textShadow: 'none' },
        { transform: 'scale(1.55)', textShadow: '0 0 18px #facc15' },
        { transform: 'scale(1)', textShadow: 'none' }
      ],
      { duration: 520, easing: 'ease-out' }
    );
    return true;
  }

  function celebrateNewRecord() {
    if (animateRecord(highScoreEl)) celebrationCount += 1;
  }

  function celebrateNewBestRound() {
    if (animateRecord(bestRoundEl)) bestRoundCelebrationCount += 1;
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
      persistPositiveInteger(SCORE_STORAGE_KEY, highScore);
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

  function syncBestRound() {
    if (!trackingRun) return;

    const currentRound = Number.parseInt(roundEl.textContent || '0', 10);
    if (!Number.isInteger(currentRound) || currentRound < 1 || currentRound <= bestRound) return;

    bestRound = currentRound;
    bestRoundEl.textContent = String(bestRound);
    persistPositiveInteger(ROUND_STORAGE_KEY, bestRound);

    if (
      bestRoundToBeat > 0 &&
      currentRound > bestRoundToBeat &&
      !celebratedBestRoundThisRun
    ) {
      celebratedBestRoundThisRun = true;
      celebrateNewBestRound();
    }
  }

  startButton.addEventListener('click', () => {
    trackingRun = true;
    bestRoundToBeat = bestRound;
    celebratedBestRoundThisRun = false;
    syncBestRound();
  });

  new MutationObserver(syncHighScore).observe(scoreEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  new MutationObserver(syncBestRound).observe(roundEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__HIGH_SCORE_DEBUG__ = {
    getHighScore() {
      return highScore;
    },
    getBestRound() {
      return bestRound;
    },
    getCelebrationCount() {
      return celebrationCount;
    },
    getBestRoundCelebrationCount() {
      return bestRoundCelebrationCount;
    }
  };
})();
