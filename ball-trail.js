(() => {
  const gameCanvas = document.getElementById('game');
  const gameDebug = window.__GAME_DEBUG__;
  if (!gameCanvas || !gameDebug) return;

  const trailCanvas = document.createElement('canvas');
  trailCanvas.width = gameCanvas.width;
  trailCanvas.height = gameCanvas.height;
  trailCanvas.setAttribute('aria-hidden', 'true');
  trailCanvas.style.position = 'fixed';
  trailCanvas.style.pointerEvents = 'none';
  trailCanvas.style.zIndex = '2';
  trailCanvas.style.background = 'transparent';
  document.body.appendChild(trailCanvas);

  const ctx = trailCanvas.getContext('2d');
  const MAX_TRAIL_POINTS = 4;
  const COUNTDOWN_SEGMENT_STEPS = 15;
  const SCORE_POPUP_FRAMES = 42;
  const trail = [];
  let lastSample = null;
  let countdownValue = null;
  let previousScore = gameDebug.getState().score;
  let scorePopup = null;

  function syncOverlayBounds() {
    const rect = gameCanvas.getBoundingClientRect();
    trailCanvas.style.left = `${rect.left}px`;
    trailCanvas.style.top = `${rect.top}px`;
    trailCanvas.style.width = `${rect.width}px`;
    trailCanvas.style.height = `${rect.height}px`;
  }

  function clearTrail() {
    trail.length = 0;
    lastSample = null;
  }

  function sampleState() {
    const state = gameDebug.getState();

    if (state.score > previousScore) {
      scorePopup = {
        x: state.ball.x,
        y: state.ball.y,
        value: state.score - previousScore,
        life: SCORE_POPUP_FRAMES
      };
    } else if (state.score < previousScore) {
      scorePopup = null;
    }
    previousScore = state.score;

    if (!state.running || state.respawnGrace > 0 || state.pausedByFocusLoss || state.pausedByPlayer) {
      clearTrail();
      return state;
    }

    const sample = { x: state.ball.x, y: state.ball.y, r: state.ball.r };
    if (!lastSample || sample.x !== lastSample.x || sample.y !== lastSample.y) {
      trail.push(sample);
      if (trail.length > MAX_TRAIL_POINTS) trail.shift();
      lastSample = sample;
    }
    return state;
  }

  function renderCountdown(state) {
    countdownValue = null;
    if (!state.running || state.respawnGrace <= 0 || state.pausedByFocusLoss || state.pausedByPlayer) return;

    countdownValue = Math.max(1, Math.min(3, Math.ceil(state.respawnGrace / COUNTDOWN_SEGMENT_STEPS)));
    ctx.save();
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#0f172a';
    ctx.shadowBlur = 10;
    ctx.fillText(String(countdownValue), state.ball.x, state.ball.y - 42);
    ctx.restore();
  }

  function renderScorePopup() {
    if (!scorePopup) return;

    const progress = 1 - scorePopup.life / SCORE_POPUP_FRAMES;
    ctx.save();
    ctx.globalAlpha = Math.min(1, scorePopup.life / 12);
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#0f172a';
    ctx.shadowBlur = 8;
    ctx.fillText(`+${scorePopup.value}`, scorePopup.x, scorePopup.y - 18 - progress * 18);
    ctx.restore();

    scorePopup.life -= 1;
    if (scorePopup.life <= 0) scorePopup = null;
  }

  function render(state) {
    syncOverlayBounds();
    ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

    trail.forEach((point, index) => {
      const progress = (index + 1) / (trail.length + 1);
      ctx.save();
      ctx.globalAlpha = 0.08 + progress * 0.18;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r * (0.45 + progress * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    renderCountdown(state);
    renderScorePopup();
  }

  function refresh() {
    const state = sampleState();
    render(state);
  }

  function frame() {
    refresh();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', syncOverlayBounds);
  window.addEventListener('scroll', syncOverlayBounds, { passive: true });
  frame();

  window.__BALL_TRAIL_DEBUG__ = {
    refresh,
    getTrailLength() {
      return trail.length;
    },
    getMaxTrailPoints() {
      return MAX_TRAIL_POINTS;
    },
    getCountdownValue() {
      return countdownValue;
    },
    getScorePopup() {
      return scorePopup ? { ...scorePopup } : null;
    }
  };
})();