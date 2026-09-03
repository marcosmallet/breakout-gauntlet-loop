(() => {
  const EDGE_THRESHOLD = 0.72;
  const EDGE_SPEED_SCALE = 1.06;
  const MAX_BALL_SPEED = 8;
  let wasFlashing = false;
  let boostCount = 0;

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
      }
    }

    wasFlashing = flashing;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  window.__EDGE_SHOT_BOOST_DEBUG__ = {
    getBoostCount: () => boostCount,
    threshold: EDGE_THRESHOLD,
    speedScale: EDGE_SPEED_SCALE
  };
})();
