(() => {
  const roundEl = document.getElementById('round');
  const bestRoundEl = document.getElementById('bestRound');
  const startButton = document.getElementById('startButton');
  if (!roundEl || !bestRoundEl || !startButton) return;

  const STORAGE_KEY = 'breakoutBestRound';

  function readStoredBestRound() {
    try {
      const value = Number.parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return Number.isInteger(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  let bestRound = readStoredBestRound();
  let trackingRun = false;
  bestRoundEl.textContent = bestRound > 0 ? String(bestRound) : '—';

  function syncBestRound() {
    if (!trackingRun) return;

    const currentRound = Number.parseInt(roundEl.textContent || '0', 10);
    if (!Number.isInteger(currentRound) || currentRound < 1 || currentRound <= bestRound) return;

    bestRound = currentRound;
    bestRoundEl.textContent = String(bestRound);
    try {
      localStorage.setItem(STORAGE_KEY, String(bestRound));
    } catch {
      // Keep the best round visible for this page session even if storage is unavailable.
    }
  }

  startButton.addEventListener('click', () => {
    trackingRun = true;
    syncBestRound();
  });

  new MutationObserver(syncBestRound).observe(roundEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__BEST_ROUND_DEBUG__ = {
    getBestRound: () => bestRound
  };
})();
