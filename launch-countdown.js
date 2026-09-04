(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const GRACE_STEPS = 45;
  const COUNTDOWN_STEPS = 15;
  const AIM_GUIDE_LENGTH = 88;
  const AIM_GUIDE_RISE = 70;
  const AIM_HINT_TEXT = 'Mova para mirar';
  let currentCountdown = 0;
  let currentAimDirection = 0;
  let aimHintVisible = false;
  let defaultLaunchVx = null;
  let previousGrace = 0;
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

  function drawAimGuide(state, aimDirection) {
    if (aimDirection === 0 || !state?.ball) return;

    const startX = state.ball.x;
    const startY = state.ball.y - state.ball.r - 5;
    const endX = startX + aimDirection * AIM_GUIDE_LENGTH;
    const endY = startY - AIM_GUIDE_RISE;

    ctx.save();
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.72)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.shadowColor = 'rgba(103, 232, 249, 0.45)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
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
    } else {
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
      ctx.shadowBlur = 8;
      ctx.fillText(AIM_HINT_TEXT, canvas.width / 2, canvas.height * 0.62 + 58);
    }
    ctx.restore();
  }

  function frame() {
    const state = window.__GAME_DEBUG__?.getState?.();
    const grace = Math.max(0, Math.min(GRACE_STEPS, state?.respawnGrace || 0));

    if (grace > previousGrace && state?.ball) {
      defaultLaunchVx = state.ball.vx;
    }

    currentCountdown = state?.running ? countdownForGrace(grace) : 0;
    currentAimDirection = currentCountdown > 0 ? aimDirectionForState(state) : 0;
    aimHintVisible = currentCountdown > 0 && currentAimDirection === 0;

    if (currentCountdown > 0 && !state?.pausedByFocusLoss && !state?.pausedByPlayer) {
      if (state?.ball) {
        const aimedVx = currentAimDirection === 0
          ? defaultLaunchVx
          : Math.abs(state.ball.vx) * currentAimDirection;
        if (Number.isFinite(aimedVx)) {
          window.__GAME_DEBUG__?.setBall?.({ vx: aimedVx });
        }
      }
      drawAimGuide(state, currentAimDirection);
      drawCountdown(currentCountdown, currentAimDirection);
    } else if (currentCountdown === 0) {
      defaultLaunchVx = null;
      aimHintVisible = false;
    }

    previousGrace = grace;
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
    getAimHintVisible() {
      return aimHintVisible;
    },
    countdownForGrace,
    aimDirectionForState,
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
})();
