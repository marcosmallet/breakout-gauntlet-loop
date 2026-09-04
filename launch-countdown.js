(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const GRACE_STEPS = 45;
  const COUNTDOWN_STEPS = 15;
  let currentCountdown = 0;
  let currentAimDirection = 0;
  let rafId = null;

  function countdownForGrace(grace) {
    if (!(grace > 0)) return 0;
    return Math.max(1, Math.min(3, Math.ceil(grace / COUNTDOWN_STEPS)));
  }

  function aimDirectionForState(state) {
    if (!state?.paddle) return 0;
    const paddleCenter = state.paddle.x + state.paddle.w / 2;
    const deadZone = state.paddle.w / 4;
    if (paddleCenter < canvas.width / 2 - deadZone) return -1;
    if (paddleCenter > canvas.width / 2 + deadZone) return 1;
    return 0;
  }

  function drawCountdown(value, aimDirection) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 22, 0.62)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.62, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 42px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(103, 232, 249, 0.75)';
    ctx.shadowBlur = 16;
    ctx.fillText(String(value), canvas.width / 2, canvas.height * 0.62 + 1);

    if (aimDirection !== 0) {
      ctx.font = '700 28px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(
        aimDirection < 0 ? '←' : '→',
        canvas.width / 2 + aimDirection * 68,
        canvas.height * 0.62 + 1
      );
    }
    ctx.restore();
  }

  function frame() {
    const state = window.__GAME_DEBUG__?.getState?.();
    const grace = Math.max(0, Math.min(GRACE_STEPS, state?.respawnGrace || 0));
    currentCountdown = state?.running ? countdownForGrace(grace) : 0;
    currentAimDirection = currentCountdown > 0 ? aimDirectionForState(state) : 0;

    if (currentCountdown > 0 && !state?.pausedByFocusLoss && !state?.pausedByPlayer) {
      if (currentAimDirection !== 0 && state?.ball) {
        window.__GAME_DEBUG__?.setBall?.({
          vx: Math.abs(state.ball.vx) * currentAimDirection
        });
      }
      drawCountdown(currentCountdown, currentAimDirection);
    }
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  window.__LAUNCH_COUNTDOWN_DEBUG__ = {
    getCountdown() {
      return currentCountdown;
    },
    getAimDirection() {
      return currentAimDirection;
    },
    countdownForGrace,
    aimDirectionForState,
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
})();
