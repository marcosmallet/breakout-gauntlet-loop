(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const GRACE_STEPS = 45;
  const COUNTDOWN_STEPS = 15;
  const AIM_GUIDE_LENGTH = 112;
  const MIN_AIM_ANGLE_RAD = Math.PI / 6;
  const MAX_AIM_ANGLE_RAD = (58 * Math.PI) / 180;
  const AIM_HINT_TEXT = 'Mova para mirar';
  let currentCountdown = 0;
  let currentAimDirection = 0;
  let currentAimStrength = 0;
  let aimHintVisible = false;
  let defaultLaunchVelocity = null;
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

  function aimStrengthForState(state) {
    if (!state?.paddle) return 0;
    const paddleCenter = state.paddle.x + state.paddle.w / 2;
    const distanceFromCenter = Math.abs(paddleCenter - canvas.width / 2);
    const deadZone = state.paddle.w / 4;
    if (distanceFromCenter <= deadZone) return 0;

    const maxReach = canvas.width / 2 - state.paddle.w / 2;
    const usableReach = Math.max(1, maxReach - deadZone);
    return Math.max(0, Math.min(1, (distanceFromCenter - deadZone) / usableReach));
  }

  function aimedVelocityForState(state, direction, strength) {
    if (!state?.ball || direction === 0 || !(strength > 0)) return null;
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    if (!(speed > 0)) return null;

    const angle = MIN_AIM_ANGLE_RAD
      + (MAX_AIM_ANGLE_RAD - MIN_AIM_ANGLE_RAD) * strength;

    return {
      vx: Math.sin(angle) * speed * direction,
      vy: -Math.cos(angle) * speed
    };
  }

  function drawAimGuide(state, aimedVelocity) {
    if (!aimedVelocity || !state?.ball) return;

    const speed = Math.hypot(aimedVelocity.vx, aimedVelocity.vy);
    if (!(speed > 0)) return;

    const startX = state.ball.x;
    const startY = state.ball.y - state.ball.r - 5;
    const endX = startX + (aimedVelocity.vx / speed) * AIM_GUIDE_LENGTH;
    const endY = startY + (aimedVelocity.vy / speed) * AIM_GUIDE_LENGTH;

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
      defaultLaunchVelocity = { vx: state.ball.vx, vy: state.ball.vy };
    }

    currentCountdown = state?.running ? countdownForGrace(grace) : 0;
    currentAimDirection = currentCountdown > 0 ? aimDirectionForState(state) : 0;
    currentAimStrength = currentCountdown > 0 ? aimStrengthForState(state) : 0;
    aimHintVisible = currentCountdown > 0 && currentAimDirection === 0;

    if (currentCountdown > 0 && !state?.pausedByFocusLoss && !state?.pausedByPlayer) {
      const aimedVelocity = aimedVelocityForState(
        state,
        currentAimDirection,
        currentAimStrength
      );
      const launchVelocity = aimedVelocity || defaultLaunchVelocity;

      if (
        Number.isFinite(launchVelocity?.vx)
        && Number.isFinite(launchVelocity?.vy)
      ) {
        window.__GAME_DEBUG__?.setBall?.(launchVelocity);
      }

      drawAimGuide(state, aimedVelocity);
      drawCountdown(currentCountdown, currentAimDirection);
    } else if (currentCountdown === 0) {
      defaultLaunchVelocity = null;
      currentAimStrength = 0;
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
    getAimStrength() {
      return currentAimStrength;
    },
    getAimHintVisible() {
      return aimHintVisible;
    },
    countdownForGrace,
    aimDirectionForState,
    aimStrengthForState,
    aimedVelocityForState,
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
})();
