(() => {
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const roundEl = document.getElementById('round');
  const canvas = document.getElementById('game');
  const startButton = document.getElementById('startButton');
  if (!scoreEl) return;

  let audioContext = null;
  let previousScore = Number(scoreEl.textContent) || 0;
  let previousLives = Number(livesEl?.textContent) || 0;
  let previousRound = Number(roundEl?.textContent) || 1;
  let previousPaddleFlash = 0;
  let previousWallContact = false;
  let impactCount = 0;
  let lifeLossCount = 0;
  let gameOverCount = 0;
  let roundAdvanceCount = 0;
  let paddleImpactCount = 0;
  let wallImpactCount = 0;
  let lastImpactFrequency = 420;

  function ensureAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playImpact() {
    impactCount += 1;
    const combo = Math.max(1, window.__COMBO_DEBUG__?.getCombo?.() || 1);
    lastImpactFrequency = 420 + Math.min(5, combo - 1) * 55;

    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(lastImpactFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(lastImpactFrequency * 0.62, now + 0.045);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  function playPaddleImpact() {
    paddleImpactCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(280, now + 0.055);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
  }

  function playWallImpact() {
    wallImpactCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(260, now);
    oscillator.frequency.exponentialRampToValueAtTime(205, now + 0.032);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.04);
  }

  function playLifeLoss() {
    lifeLossCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  function playGameOver() {
    gameOverCount += 1;
    const context = ensureAudioContext();
    if (!context) return;

    const now = context.currentTime;
    [196, 146.83, 110].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.09;

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.045, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.17);
    });
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

  if (livesEl) {
    const livesObserver = new MutationObserver(() => {
      const nextLives = Number(livesEl.textContent) || 0;
      if (nextLives < previousLives) {
        if (nextLives === 0) playGameOver();
        else playLifeLoss();
      }
      previousLives = nextLives;
    });
    livesObserver.observe(livesEl, { childList: true, characterData: true, subtree: true });
  }

  if (roundEl) {
    const roundObserver = new MutationObserver(() => {
      const nextRound = Number(roundEl.textContent) || 1;
      if (nextRound > previousRound) playRoundAdvance();
      previousRound = nextRound;
    });
    roundObserver.observe(roundEl, { childList: true, characterData: true, subtree: true });
  }

  function watchGameImpacts() {
    const state = window.__GAME_DEBUG__?.getState?.();
    const nextPaddleFlash = state?.paddleFlash || 0;
    if (nextPaddleFlash > previousPaddleFlash) playPaddleImpact();
    previousPaddleFlash = nextPaddleFlash;

    const ball = state?.ball;
    const wallContact = Boolean(ball && (
      ball.x - ball.r <= 0 ||
      ball.x + ball.r >= canvas.width ||
      ball.y - ball.r <= 0
    ));
    if (wallContact && !previousWallContact) playWallImpact();
    previousWallContact = wallContact;

    requestAnimationFrame(watchGameImpacts);
  }
  requestAnimationFrame(watchGameImpacts);

  canvas?.addEventListener('pointerdown', ensureAudioContext, { once: true });
  startButton?.addEventListener('click', ensureAudioContext, { once: true });

  window.__IMPACT_SOUND_DEBUG__ = {
    getImpactCount() {
      return impactCount;
    },
    getLifeLossCount() {
      return lifeLossCount;
    },
    getGameOverCount() {
      return gameOverCount;
    },
    getRoundAdvanceCount() {
      return roundAdvanceCount;
    },
    getPaddleImpactCount() {
      return paddleImpactCount;
    },
    getWallImpactCount() {
      return wallImpactCount;
    },
    getLastImpactFrequency() {
      return lastImpactFrequency;
    }
  };
})();