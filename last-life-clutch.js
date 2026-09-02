(() => {
  const livesEl = document.getElementById('lives');
  const startButton = document.getElementById('startButton');
  const CLUTCH_SPEED_SCALE = 0.88;
  let applied = false;

  function sync() {
    const state = window.__GAME_DEBUG__?.getState?.();
    if (!state) return;

    if (state.lives !== 1) {
      applied = false;
      return;
    }

    if (applied || !state.running) return;

    window.__GAME_DEBUG__.setBall({
      vx: state.ball.vx * CLUTCH_SPEED_SCALE,
      vy: state.ball.vy * CLUTCH_SPEED_SCALE
    });
    applied = true;
  }

  new MutationObserver(sync).observe(livesEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  startButton.addEventListener('click', () => {
    applied = false;
    queueMicrotask(sync);
  });

  window.__LAST_LIFE_CLUTCH_DEBUG__ = {
    sync,
    isApplied: () => applied,
    speedScale: CLUTCH_SPEED_SCALE
  };
})();
