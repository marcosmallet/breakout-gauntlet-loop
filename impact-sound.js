(() => {
  const scoreEl = document.getElementById('score');
  const roundEl = document.getElementById('round');
  const canvas = document.getElementById('game');
  const startButton = document.getElementById('startButton');
  if (!scoreEl) return;

  let audioContext = null;
  let previousScore = Number(scoreEl.textContent) || 0;
  let previousRound = Number(roundEl?.textContent) || 1;
  let impactCount = 0;
  let roundAdvanceCount = 0;

  function ensureAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playImpact() {
    impactCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(420, now);
    oscillator.frequency.exponentialRampToValueAtTime(260, now + 0.045);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  function playRoundAdvance() {
    roundAdvanceCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const now = context.currentTime;
    [523.25, 659.25].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.07;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.12);
    });
  }

  const scoreObserver = new MutationObserver(() => {
    const nextScore = Number(scoreEl.textContent) || 0;
    if (nextScore > previousScore) playImpact();
    previousScore = nextScore;
  });

  scoreObserver.observe(scoreEl, { childList: true, characterData: true, subtree: true });

  if (roundEl) {
    const roundObserver = new MutationObserver(() => {
      const nextRound = Number(roundEl.textContent) || 1;
      if (nextRound > previousRound) playRoundAdvance();
      previousRound = nextRound;
    });
    roundObserver.observe(roundEl, { childList: true, characterData: true, subtree: true });
  }

  canvas?.addEventListener('pointerdown', ensureAudioContext, { once: true });
  startButton?.addEventListener('click', ensureAudioContext, { once: true });

  window.__IMPACT_SOUND_DEBUG__ = {
    getImpactCount() {
      return impactCount;
    },
    getRoundAdvanceCount() {
      return roundAdvanceCount;
    }
  };
})();
