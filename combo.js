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
  let feedbackCount = 0;
  let scoreFeedbackCount = 0;

  function render() {
    comboEl.textContent = `x${combo}`;
  }

  function pulseScore() {
    scoreFeedbackCount += 1;
    scoreEl.animate(
      [
        { transform: 'scale(1)', textShadow: 'none' },
        { transform: 'scale(1.18)', textShadow: '0 0 12px currentColor' },
        { transform: 'scale(1)', textShadow: 'none' }
      ],
      { duration: 160, easing: 'ease-out' }
    );
  }

  function pulseCombo() {
    if (combo < 2) return;
    feedbackCount += 1;
    comboEl.classList.remove('combo-pop');
    void comboEl.offsetWidth;
    comboEl.classList.add('combo-pop');
  }

  function resetCombo() {
    combo = 0;
    lastHitAt = 0;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
    comboEl.classList.remove('combo-pop');
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
    pulseScore();
    render();
    pulseCombo();
    scheduleReset();
  }

  comboEl.addEventListener('animationend', () => {
    comboEl.classList.remove('combo-pop');
  });

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
    },
    getFeedbackCount() {
      return feedbackCount;
    },
    getScoreFeedbackCount() {
      return scoreFeedbackCount;
    }
  };
})();
