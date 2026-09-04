(() => {
  const EDGE_THRESHOLD = 0.72;
  const EDGE_SPEED_SCALE = 1.06;
  const MAX_BALL_SPEED = 8;
  const FEEDBACK_DURATION_MS = 180;
  const canvas = document.getElementById('game');
  const startButton = document.getElementById('startButton');
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let wasFlashing = false;
  let boostCount = 0;
  let soundFeedbackCount = 0;
  let feedbackTimer = null;
  let audioContext = null;

  function primeAudio() {
    if (!AudioContextCtor) return;
    if (!audioContext) audioContext = new AudioContextCtor();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function playBoostSound() {
    soundFeedbackCount += 1;
    if (!audioContext || audioContext.state !== 'running') return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.085);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.105);
  }

  function showBoostFeedback() {
    if (!canvas) return;

    if (feedbackTimer) clearTimeout(feedbackTimer);
    canvas.classList.remove('edge-shot-boost');
    void canvas.offsetWidth;
    canvas.classList.add('edge-shot-boost');
    feedbackTimer = setTimeout(() => {
      canvas.classList.remove('edge-shot-boost');
      feedbackTimer = null;
    }, FEEDBACK_DURATION_MS);
  }

  function tick() {
    const state = window.__GAME_DEBUG__?.getState?.();
    const flashing = Boolean(state?.paddleFlash > 0);

    if (state?.running && flashing && !wasFlashing) {
      const paddleCenter = state.paddle.x + state.paddle.w / 2;
      const normalizedHit = Math.abs(
        (state.ball.x - paddleCenter) / (state.paddle.w / 2)
      );
      const speed = Math.hypot(state.ball.vx, state.ball.vy);

      if (normalizedHit >= EDGE_THRESHOLD && speed > 0 && speed < MAX_BALL_SPEED) {
        const nextSpeed = Math.min(MAX_BALL_SPEED, speed * EDGE_SPEED_SCALE);
        const scale = nextSpeed / speed;
        window.__GAME_DEBUG__.setBall({
          vx: state.ball.vx * scale,
          vy: state.ball.vy * scale
        });
        boostCount += 1;
        showBoostFeedback();
        playBoostSound();
      }
    }

    wasFlashing = flashing;
    requestAnimationFrame(tick);
  }

  startButton?.addEventListener('click', primeAudio, { once: true });
  canvas?.addEventListener('pointerdown', primeAudio, { once: true });
  requestAnimationFrame(tick);

  window.__EDGE_SHOT_BOOST_DEBUG__ = {
    getBoostCount: () => boostCount,
    getSoundFeedbackCount: () => soundFeedbackCount,
    threshold: EDGE_THRESHOLD,
    speedScale: EDGE_SPEED_SCALE
  };
})();
