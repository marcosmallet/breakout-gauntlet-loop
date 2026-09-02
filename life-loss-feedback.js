(() => {
  const livesEl = document.getElementById('lives');
  const canvas = document.getElementById('game');
  if (!livesEl || !canvas) return;

  let previousLives = Number(livesEl.textContent) || 0;
  let pulseCount = 0;

  const triggerPulse = () => {
    pulseCount += 1;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    canvas.classList.remove('life-loss-pulse');
    void canvas.offsetWidth;
    canvas.classList.add('life-loss-pulse');
  };

  const observer = new MutationObserver(() => {
    const nextLives = Number(livesEl.textContent) || 0;
    if (nextLives < previousLives) triggerPulse();
    previousLives = nextLives;
  });

  observer.observe(livesEl, { childList: true, characterData: true, subtree: true });
  canvas.addEventListener('animationend', (event) => {
    if (event.animationName === 'life-loss-pulse') canvas.classList.remove('life-loss-pulse');
  });

  window.__LIFE_LOSS_FEEDBACK_DEBUG__ = {
    get pulseCount() {
      return pulseCount;
    }
  };
})();
