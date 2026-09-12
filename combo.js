(() => {
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const comboEl = document.getElementById('combo');
  const powerStatusEl = document.getElementById('powerStatus');
  const startButton = document.getElementById('startButton');
  const gameStatusEl = document.getElementById('gameStatus');
  if (!scoreEl || !livesEl || !comboEl || !gameStatusEl) return;

  const BASE_COMBO_WINDOW_MS = 2000;
  const ELITE_COMBO_WINDOW_MS = 2500;
  const SLOW_TIME_SCALE = 0.72;
  const NORMAL_MAX_COMBO_MULTIPLIER = 5;
  const ELITE_MAX_COMBO_MULTIPLIER = 6;
  const BRICK_SCORE_UNIT = 10;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let previousScore = Number(scoreEl.textContent) || 0;
  let previousLives = Number(livesEl.textContent) || 0;
  let combo = 0;
  let resetTimer = null;
  let comboWindowExpiresAt = 0;
  let comboWindowRemainingMs = 0;
  let timerStartedAt = 0;
  let timerTimeScale = 1;
  let pauseStartedAt = null;
  let feedbackCount = 0;
  let scoreFeedbackCount = 0;
  let soundFeedbackCount = 0;
  let audioContext = null;
  let reducedMotionCueTimer = null;
  let reducedMotionSeconds = null;

  function maxComboMultiplier() {
    return window.GameDifficulty?.isEliteRoundActive?.()
      ? ELITE_MAX_COMBO_MULTIPLIER
      : NORMAL_MAX_COMBO_MULTIPLIER;
  }

  function maxBrickScoreDelta() {
    return maxComboMultiplier() * BRICK_SCORE_UNIT;
  }

  function comboWindowMs() {
    return window.GameDifficulty?.isEliteRoundActive?.()
      ? ELITE_COMBO_WINDOW_MS
      : BASE_COMBO_WINDOW_MS;
  }

  function gameplayTimeScale() {
    return powerStatusEl?.textContent.includes('Tempo lento') ? SLOW_TIME_SCALE : 1;
  }

  function effectiveWindowMs() {
    return comboWindowMs() / gameplayTimeScale();
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  function render() {
    const maxMultiplier = maxComboMultiplier();
    const multiplier = Math.min(combo, maxMultiplier);
    const comboLabel = combo >= maxMultiplier
      ? `x${multiplier} MAX`
      : `x${multiplier}`;
    comboEl.textContent = prefersReducedMotion() && combo > 0 && reducedMotionSeconds !== null
      ? `${comboLabel} · ${reducedMotionSeconds}s`
      : comboLabel;
  }

  function clearReducedMotionCue() {
    if (reducedMotionCueTimer) clearTimeout(reducedMotionCueTimer);
    reducedMotionCueTimer = null;
    reducedMotionSeconds = null;
  }

  function scheduleReducedMotionCue(realDelay) {
    clearReducedMotionCue();
    if (!prefersReducedMotion() || combo <= 0 || !Number.isFinite(realDelay) || realDelay <= 0) return;

    reducedMotionSeconds = Math.max(1, Math.ceil(realDelay / 1000));
    render();

    const lastSecondStartsIn = realDelay - 1000;
    if (lastSecondStartsIn > 0) {
      reducedMotionCueTimer = setTimeout(() => {
        reducedMotionCueTimer = null;
        reducedMotionSeconds = 1;
        render();
      }, lastSecondStartsIn);
    }
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
    oscillator.frequency.setValueAtTime(220 + Math.min(combo, maxComboMultiplier()) * 45, now);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
  }

  function pulseScore() {
    if (prefersReducedMotion()) return;
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

  function restartComboWindowFeedback(durationMs = effectiveWindowMs()) {
    comboEl.style.setProperty('--combo-window-duration', `${durationMs}ms`);
    comboEl.classList.remove('combo-window');
    void comboEl.offsetWidth;
    comboEl.classList.add('combo-window');
  }

  function resetCombo() {
    combo = 0;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
    comboWindowExpiresAt = 0;
    comboWindowRemainingMs = 0;
    timerStartedAt = 0;
    timerTimeScale = 1;
    pauseStartedAt = null;
    clearReducedMotionCue();
    comboEl.classList.remove('combo-pop', 'combo-window', 'combo-window-paused');
    render();
  }

  function consumeElapsedGameplayTime() {
    if (!resetTimer || timerStartedAt === 0 || combo <= 0) return;
    const now = performance.now();
    comboWindowRemainingMs = Math.max(
      0,
      comboWindowRemainingMs - (now - timerStartedAt) * timerTimeScale
    );
    timerStartedAt = now;
  }

  function scheduleReset(delay = comboWindowMs()) {
    if (resetTimer) clearTimeout(resetTimer);
    comboWindowRemainingMs = Math.max(0, delay);
    timerTimeScale = gameplayTimeScale();
    timerStartedAt = performance.now();
    const realDelay = comboWindowRemainingMs / timerTimeScale;
    comboWindowExpiresAt = timerStartedAt + realDelay;
    resetTimer = setTimeout(resetCombo, realDelay);
    scheduleReducedMotionCue(realDelay);
    return realDelay;
  }

  function rescaleActiveWindow() {
    if (!resetTimer || combo <= 0 || pauseStartedAt !== null) return;
    consumeElapsedGameplayTime();
    if (comboWindowRemainingMs <= 0) {
      resetCombo();
      return;
    }
    const remainingRealMs = scheduleReset(comboWindowRemainingMs);
    restartComboWindowFeedback(remainingRealMs);
  }

  function suspendComboWindow() {
    if (pauseStartedAt !== null) return;
    pauseStartedAt = performance.now();
    if (!resetTimer || combo <= 0) return;

    consumeElapsedGameplayTime();
    if (reducedMotionCueTimer) clearTimeout(reducedMotionCueTimer);
    reducedMotionCueTimer = null;
    if (prefersReducedMotion()) {
      reducedMotionSeconds = Math.max(1, Math.ceil(comboWindowRemainingMs / timerTimeScale / 1000));
      render();
    }
    comboEl.classList.add('combo-window-paused');
    clearTimeout(resetTimer);
    resetTimer = null;
    timerStartedAt = 0;
  }

  function resumeComboWindow() {
    if (pauseStartedAt === null) return;

    pauseStartedAt = null;
    comboEl.classList.remove('combo-window-paused');

    if (combo > 0 && comboWindowRemainingMs > 0) {
      const remainingRealMs = scheduleReset(comboWindowRemainingMs);
      restartComboWindowFeedback(remainingRealMs);
    }
  }

  function registerHit() {
    if (resetTimer && combo > 0) consumeElapsedGameplayTime();
    const continuesCombo = combo > 0 && comboWindowRemainingMs > 0;
    combo = continuesCombo ? combo + 1 : 1;
    playHitSound();
    pulseScore();
    render();
    pulseCombo();
    const realWindowMs = scheduleReset(comboWindowMs());
    restartComboWindowFeedback(realWindowMs);
  }

  function applyScoreDelta(nextScore) {
    const delta = nextScore - previousScore;
    const maxBrickDelta = maxBrickScoreDelta();
    if (delta > 0 && delta <= maxBrickDelta) registerHit();
    if (delta < 0 || delta > maxBrickDelta) resetCombo();
    previousScore = nextScore;
  }

  function scoreFromMutation(mutation) {
    if (mutation.type === 'characterData') {
      const value = Number(mutation.target.textContent);
      return Number.isFinite(value) ? value : null;
    }

    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      const text = Array.from(mutation.addedNodes)
        .map((node) => node.textContent || '')
        .join('');
      const value = Number(text);
      return Number.isFinite(value) ? value : null;
    }

    return null;
  }

  startButton?.addEventListener('click', primeAudio);

  comboEl.addEventListener('animationend', (event) => {
    if (event.animationName === 'combo-pop') comboEl.classList.remove('combo-pop');
  });

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const mutationScore = scoreFromMutation(mutation);
      if (mutationScore !== null && mutationScore !== previousScore) {
        applyScoreDelta(mutationScore);
      }
    }

    const finalScore = Number(scoreEl.textContent) || 0;
    if (finalScore !== previousScore) applyScoreDelta(finalScore);
  }).observe(scoreEl, { childList: true, characterData: true, subtree: true });

  new MutationObserver(() => {
    const nextLives = Number(livesEl.textContent) || 0;
    if (nextLives < previousLives) resetCombo();
    previousLives = nextLives;
  }).observe(livesEl, { childList: true, characterData: true, subtree: true });

  let wasPaused = gameStatusEl.textContent.trim() === 'Pausado.';
  new MutationObserver(() => {
    const status = gameStatusEl.textContent.trim();
    const isPaused = status === 'Pausado.';
    if (status === 'Escudo salvou a bola!') resetCombo();
    if (isPaused && !wasPaused) suspendComboWindow();
    if (!isPaused && wasPaused) resumeComboWindow();
    wasPaused = isPaused;
  }).observe(gameStatusEl, { childList: true, characterData: true, subtree: true });

  let wasSlowActive = gameplayTimeScale() < 1;
  if (powerStatusEl) {
    new MutationObserver(() => {
      const isSlowActive = gameplayTimeScale() < 1;
      if (isSlowActive !== wasSlowActive) {
        wasSlowActive = isSlowActive;
        rescaleActiveWindow();
      }
    }).observe(powerStatusEl, { childList: true, characterData: true, subtree: true });
  }

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
    },
    getWindowMs() {
      return comboWindowMs();
    },
    getMaxMultiplier() {
      return maxComboMultiplier();
    },
    getMaxBrickScoreDelta() {
      return maxBrickScoreDelta();
    },
    getEffectiveWindowMs() {
      return effectiveWindowMs();
    },
    getRemainingGameplayMs() {
      if (resetTimer && combo > 0) consumeElapsedGameplayTime();
      return comboWindowRemainingMs;
    }
  };
})();