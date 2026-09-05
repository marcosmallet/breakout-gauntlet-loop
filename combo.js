(() => {
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const comboEl = document.getElementById('combo');
  const startButton = document.getElementById('startButton');
  const gameStatusEl = document.getElementById('gameStatus');
  if (!scoreEl || !livesEl || !comboEl || !gameStatusEl) return;

  const COMBO_WINDOW_MS = 2000;
  const MAX_COMBO_MULTIPLIER = 5;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let previousScore = Number(scoreEl.textContent) || 0;
  let previousLives = Number(livesEl.textContent) || 0;
  let combo = 0;
  let lastHitAt = 0;
  let resetTimer = null;
  let comboWindowExpiresAt = 0;
  let comboWindowRemainingMs = 0;
  let pauseStartedAt = null;
  let feedbackCount = 0;
  let scoreFeedbackCount = 0;
  let soundFeedbackCount = 0;
  let audioContext = null;

  function render() {
    const multiplier = Math.min(combo, MAX_COMBO_MULTIPLIER);
    comboEl.textContent = combo >= MAX_COMBO_MULTIPLIER
      ? `x${multiplier} MAX`
      : `x${multiplier}`;
  }

  function primeAudio() {
    if (!AudioContextCtor) return;
    if (!audioContext) audioContext = new AudioContextCtor();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function playHitSound() {
    soundFeedbackCount += 1;
    if (!audioContext || audioContext.state !== 'running') return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220 + Math.min(combo, 5) * 45, now);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
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

  function restartComboWindowFeedback() {
    comboEl.classList.remove('combo-window');
    void comboEl.offsetWidth;
    comboEl.classList.add('combo-window');
  }

  function resetCombo() {
    combo = 0;
    lastHitAt = 0;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
    comboWindowExpiresAt = 0;
    comboWindowRemainingMs = 0;
    pauseStartedAt = null;
    comboEl.classList.remove('combo-pop', 'combo-window', 'combo-window-paused');
    render();
  }

  function scheduleReset(delay = COMBO_WINDOW_MS) {
    if (resetTimer) clearTimeout(resetTimer);
    comboWindowRemainingMs = Math.max(0, delay);
    comboWindowExpiresAt = performance.now() + comboWindowRemainingMs;
    resetTimer = setTimeout(resetCombo, comboWindowRemainingMs);
  }

  function suspendComboWindow() {
    if (pauseStartedAt !== null) return;
    pauseStartedAt = performance.now();
    if (!resetTimer || combo <= 0) return;

    comboWindowRemainingMs = Math.max(0, comboWindowExpiresAt - pauseStartedAt);
    comboEl.classList.add('combo-window-paused');
    clearTimeout(resetTimer);
    resetTimer = null;
  }

  function resumeComboWindow() {
    if (pauseStartedAt === null) return;

    const now = performance.now();
    const pausedDuration = now - pauseStartedAt;
    pauseStartedAt = null;
    comboEl.classList.remove('combo-window-paused');
    if (lastHitAt) lastHitAt += pausedDuration;

    if (combo > 0 && comboWindowRemainingMs > 0) {
      scheduleReset(comboWindowRemainingMs);
    }
  }

  function registerHit() {
    const now = performance.now();
    combo = lastHitAt && now - lastHitAt <= COMBO_WINDOW_MS ? combo + 1 : 1;
    lastHitAt = now;
    playHitSound();
    pulseScore();
    render();
    pulseCombo();
    restartComboWindowFeedback();
    scheduleReset();
  }

  startButton?.addEventListener('click', primeAudio);

  comboEl.addEventListener('animationend', (event) => {
    if (event.animationName === 'combo-pop') comboEl.classList.remove('combo-pop');
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

  let wasPaused = gameStatusEl.textContent.trim() === 'Pausado.';
  new MutationObserver(() => {
    const isPaused = gameStatusEl.textContent.trim() === 'Pausado.';
    if (isPaused && !wasPaused) suspendComboWindow();
    if (!isPaused && wasPaused) resumeComboWindow();
    wasPaused = isPaused;
  }).observe(gameStatusEl, { childList: true, characterData: true, subtree: true });

  window.__COMBO_DEBUG__ = {
    getCombo() {
      return combo;
    },
    getFeedbackCount() {
      return feedbackCount;
    },
    getScoreFeedbackCount() {
      return scoreFeedbackCount;
    },
    getSoundFeedbackCount() {
      return soundFeedbackCount;
    }
  };
})();
