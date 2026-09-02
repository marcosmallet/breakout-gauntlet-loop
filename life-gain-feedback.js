(() => {
  const livesEl = document.getElementById('lives');
  const gameStatusEl = document.getElementById('gameStatus');
  if (!livesEl || !gameStatusEl) return;

  let previousLives = Number(livesEl.textContent) || 0;
  let feedbackCount = 0;

  function pulseLifeGain() {
    feedbackCount += 1;
    livesEl.classList.remove('life-gain-pop');
    void livesEl.offsetWidth;
    livesEl.classList.add('life-gain-pop');
  }

  livesEl.addEventListener('animationend', () => {
    livesEl.classList.remove('life-gain-pop');
  });

  new MutationObserver(() => {
    const nextLives = Number(livesEl.textContent) || 0;
    const earnedExtraLife = nextLives > previousLives && gameStatusEl.textContent.includes('Vida extra.');
    previousLives = nextLives;
    if (earnedExtraLife) pulseLifeGain();
  }).observe(livesEl, { childList: true, characterData: true, subtree: true });

  window.__LIFE_GAIN_FEEDBACK_DEBUG__ = {
    getFeedbackCount() {
      return feedbackCount;
    }
  };
})();
