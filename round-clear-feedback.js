(() => {
  const canvas = document.getElementById('game');
  const roundEl = document.getElementById('round');
  if (!canvas || !roundEl) return;

  let lastRound = Number.parseInt(roundEl.textContent, 10) || 1;
  let pulseCount = 0;

  function pulseRoundClear() {
    pulseCount += 1;
    canvas.dataset.roundClearPulse = String(pulseCount);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hue = getComputedStyle(canvas).getPropertyValue('--round-accent-hue').trim() || '205';

    if (reducedMotion || typeof canvas.animate !== 'function') {
      const previousBoxShadow = canvas.style.boxShadow;
      canvas.style.boxShadow = `0 0 0 3px hsla(${hue}, 90%, 70%, 0.75)`;
      const pulseId = pulseCount;
      window.setTimeout(() => {
        if (pulseCount === pulseId) canvas.style.boxShadow = previousBoxShadow;
      }, 180);
      return;
    }

    canvas.animate([
      {
        boxShadow: `0 0 0 2px hsla(${hue}, 90%, 70%, 0.9)`,
        filter: 'brightness(1)'
      },
      {
        boxShadow: `0 0 34px 8px hsla(${hue}, 90%, 70%, 0.8)`,
        filter: 'brightness(1.18)'
      },
      {
        boxShadow: `0 0 0 0 hsla(${hue}, 90%, 70%, 0)`,
        filter: 'brightness(1)'
      }
    ], {
      duration: 520,
      easing: 'ease-out'
    });
  }

  new MutationObserver(() => {
    const currentRound = Number.parseInt(roundEl.textContent, 10);
    if (!Number.isInteger(currentRound)) return;
    if (currentRound > lastRound) pulseRoundClear();
    lastRound = currentRound;
  }).observe(roundEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__ROUND_CLEAR_FEEDBACK_DEBUG__ = {
    getPulseCount: () => pulseCount
  };
})();
