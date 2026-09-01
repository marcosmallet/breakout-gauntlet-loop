(() => {
  const scoreEl = document.getElementById('score');
  const canvas = document.getElementById('game');
  const startButton = document.getElementById('startButton');
  if (!scoreEl) return;

  let audioContext = null;
  let previousScore = Number(scoreEl.textContent) || 0;
  let impactCount = 0;

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

  const observer = new MutationObserver(() => {
    const nextScore = Number(scoreEl.textContent) || 0;
    if (nextScore > previousScore) playImpact();
    previousScore = nextScore;
  });

  observer.observe(scoreEl, { childList: true, characterData: true, subtree: true });
  canvas?.addEventListener('pointerdown', ensureAudioContext, { once: true });
  startButton?.addEventListener('click', ensureAudioContext, { once: true });

  window.__IMPACT_SOUND_DEBUG__ = {
    getImpactCount() {
      return impactCount;
    }
  };
})();
