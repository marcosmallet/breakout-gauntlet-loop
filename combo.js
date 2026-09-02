(() => {
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const comboEl = document.getElementById('combo');
  if (!scoreEl || !livesEl || !comboEl) return;

  const COMBO_WINDOW_MS = 2000;
  let previousScore = Number(scoreEl.textContent) || 0;
  let previousLives = Number(livesEl.textContent) || 0;
  let combo = 0;
  let lastHitAt = 0;
  let resetTimer = null;

  function render() {
    comboEl.textContent = `x${combo}`;
  }

  function resetCombo() {
    combo = 0;
    lastHitAt = 0;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
    render();
  }

  function scheduleReset() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(resetCombo, COMBO_WINDOW_MS);
  }

  function registerHit() {
    const now = performance.now();
    combo = lastHitAt && now - lastHitAt <= COMBO_WINDOW_MS ? combo + 1 : 1;
    lastHitAt = now;
    render();
    scheduleReset();
  }

  new MutationObserver(() => {
    const nextScore = Number(scoreEl.textContent) || 0;
    if (nextScore > previousScore) registerHit();
    if (nextScore < previousScore) resetCombo();
    previousScore = nextScore;
  }).observe(scoreEl, { childList: true, characterData: true, subtree: true });

  new MutationObserver(() => {
    const nextLives = Number(livesEl.textContent) || 0;
    if (nextLives < previousLives) resetCombo();
    previousLives = nextLives;
  }).observe(livesEl, { childList: true, characterData: true, subtree: true });

  window.__COMBO_DEBUG__ = {
    getCombo() {
      return combo;
    }
  };
})();
