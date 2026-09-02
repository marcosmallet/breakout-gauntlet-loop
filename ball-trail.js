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
  const trail = [];
  let lastSample = null;

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

  function render() {
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
  }

  function refresh() {
    sampleState();
    render();
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
    }
  };
})();
