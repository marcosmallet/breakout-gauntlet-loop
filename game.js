(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const layoutNameEl = document.getElementById('layoutName');
  const powerStatusEl = document.getElementById('powerStatus');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const gameStatusEl = document.getElementById('gameStatus');

  const W = canvas.width;
  const H = canvas.height;
  const MIN_HORIZONTAL_SPEED = 1.5;
  const MIN_VERTICAL_SPEED = 1.5;
  const BRICK_SPEED_MULTIPLIER = 1.012;
  const ROUND_SPEED_STEP = 0.25;
  const MAX_ROUND_START_COMPONENT = 5;
  const MAX_LIVES = 5;
  const MAX_COMBO_MULTIPLIER = 5;
  const ROUND_CLEAR_LIFE_BONUS = 100;
  const TARGET_FRAME_MS = 1000 / 60;
  const MAX_FRAME_STEP = 2;
  const RESPAWN_GRACE_STEPS = 45;
  const ROUND_TRANSITION_STEPS = 54;
  const IMPACT_FLASH_STEPS = 8;
  const PADDLE_FLASH_STEPS = 6;
  const BASE_PADDLE_WIDTH = 110;
  const ROUND_PADDLE_SHRINK = 8;
  const MIN_PADDLE_WIDTH = 78;
  const LATE_GAME_CHANNEL_GAP = 56;
  const PHASE_LAYOUTS = ['wall', 'stagger', 'channel', 'funnel'];
  const POWER_DROP_SPEED = 3.2;
  const POWER_DROP_RADIUS = 10;
  const WIDE_PADDLE_BONUS = 34;
  const WIDE_PADDLE_DURATION_STEPS = 600;
  const MAX_POWER_PADDLE_WIDTH = 150;
  const SHIELD_Y = H - 10;

  const paddle = { x: W / 2 - BASE_PADDLE_WIDTH / 2, y: H - 38, w: BASE_PADDLE_WIDTH, h: 14, speed: 8 };
  const ball = { x: W / 2, y: H - 58, r: 8, vx: 4, vy: -4 };
  const keys = new Set();

  let score = 0;
  let lives = 3;
  let round = 1;
  let running = false;
  let rafId = null;
  let bricks = [];
  let pointerActive = false;
  let lastFrameTime = null;
  let respawnGrace = 0;
  let roundTransition = 0;
  let roundTransitionStatus = '';
  let pausedByFocusLoss = false;
  let pausedByPlayer = false;
  let impactFlash = null;
  let paddleFlash = 0;
  let powerDrops = [];
  let widePaddleSteps = 0;
  let shieldCharges = 0;

  function brickLayoutForRound(roundNumber = round) {
    return PHASE_LAYOUTS[(roundNumber - 1) % PHASE_LAYOUTS.length];
  }

  function layoutLabel(layout = brickLayoutForRound()) {
    return {
      wall: 'Muralha',
      stagger: 'Escalonada',
      channel: 'Canal',
      funnel: 'Funil'
    }[layout] || 'Muralha';
  }

  function basePaddleWidthForRound(roundNumber = round) {
    return Math.max(
      MIN_PADDLE_WIDTH,
      BASE_PADDLE_WIDTH - (roundNumber - 1) * ROUND_PADDLE_SHRINK
    );
  }

  function syncPaddleWidth() {
    const center = paddle.x + paddle.w / 2;
    const bonus = widePaddleSteps > 0 ? WIDE_PADDLE_BONUS : 0;
    paddle.w = Math.min(MAX_POWER_PADDLE_WIDTH, basePaddleWidthForRound() + bonus);
    paddle.x = Math.max(0, Math.min(W - paddle.w, center - paddle.w / 2));
  }

  function powerPlanForRound(roundNumber = round) {
    const wideIndex = (roundNumber * 7 + 3) % 50;
    let shieldIndex = (roundNumber * 11 + 17) % 50;
    if (shieldIndex === wideIndex) shieldIndex = (shieldIndex + 9) % 50;
    return { wideIndex, shieldIndex };
  }

  function syncPhaseHud() {
    if (layoutNameEl) layoutNameEl.textContent = layoutLabel();
    if (powerStatusEl) {
      const powers = [];
      if (widePaddleSteps > 0) powers.push('Raquete larga');
      if (shieldCharges > 0) powers.push('Escudo');
      powerStatusEl.textContent = powers.length ? powers.join(' + ') : '—';
    }
  }

  function brickGeometry(layout, row, col, cols = 10) {
    const gap = 8;
    const brickH = 22;
    let x;
    let brickW;

    if (layout === 'channel') {
      const margin = 32;
      brickW = (W - margin * 2 - gap * (cols - 1) - LATE_GAME_CHANNEL_GAP) / cols;
      x = margin + col * (brickW + gap) + (col >= cols / 2 ? LATE_GAME_CHANNEL_GAP : 0);
    } else if (layout === 'stagger') {
      const margin = 24;
      const shift = 18;
      brickW = (W - margin * 2 - shift - gap * (cols - 1)) / cols;
      x = margin + (row % 2 === 1 ? shift : 0) + col * (brickW + gap);
    } else if (layout === 'funnel') {
      const margin = 32;
      const insets = [0, 16, 34, 50, 28];
      const rowInset = insets[row % insets.length];
      brickW = (W - (margin + rowInset) * 2 - gap * (cols - 1)) / cols;
      x = margin + rowInset + col * (brickW + gap);
    } else {
      const margin = 32;
      brickW = (W - margin * 2 - gap * (cols - 1)) / cols;
      x = margin + col * (brickW + gap);
    }

    return {
      x,
      y: 58 + row * (brickH + gap),
      w: brickW,
      h: brickH
    };
  }

  function createBricks() {
    const rows = 5;
    const cols = 10;
    const layout = brickLayoutForRound();
    const powerPlan = powerPlanForRound();
    bricks = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const geometry = brickGeometry(layout, row, col, cols);
        bricks.push({
          ...geometry,
          alive: true,
          row,
          col,
          powerType: index === powerPlan.wideIndex
            ? 'wide'
            : (index === powerPlan.shieldIndex ? 'shield' : null)
        });
      }
    }
    syncPhaseHud();
  }

  function clearActivePowers() {
    powerDrops = [];
    widePaddleSteps = 0;
    shieldCharges = 0;
    syncPaddleWidth();
    syncPhaseHud();
  }

  function spawnPowerDrop(brick) {
    if (!brick.powerType) return;
    powerDrops.push({
      type: brick.powerType,
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      vy: POWER_DROP_SPEED
    });
  }

  function activatePower(type) {
    if (type === 'wide') {
      widePaddleSteps = WIDE_PADDLE_DURATION_STEPS;
      syncPaddleWidth();
      gameStatusEl.textContent = 'Poder coletado: Raquete larga!';
    } else if (type === 'shield') {
      shieldCharges = 1;
      gameStatusEl.textContent = 'Poder coletado: Escudo!';
    }
    syncPhaseHud();
  }

  function updatePowerUps(stepScale) {
    if (widePaddleSteps > 0) {
      const before = widePaddleSteps;
      widePaddleSteps = Math.max(0, widePaddleSteps - stepScale);
      if (before > 0 && widePaddleSteps === 0) syncPaddleWidth();
    }

    const nextDrops = [];
    for (const drop of powerDrops) {
      drop.y += drop.vy * stepScale;
      const caught = (
        drop.y + POWER_DROP_RADIUS >= paddle.y &&
        drop.y - POWER_DROP_RADIUS <= paddle.y + paddle.h &&
        drop.x + POWER_DROP_RADIUS >= paddle.x &&
        drop.x - POWER_DROP_RADIUS <= paddle.x + paddle.w
      );
      if (caught) {
        activatePower(drop.type);
      } else if (drop.y - POWER_DROP_RADIUS <= H) {
        nextDrops.push(drop);
      }
    }
    powerDrops = nextDrops;
    syncPhaseHud();
  }

  function resetBall(withGrace = false) {
    const roundStartComponent = Math.min(
      MAX_ROUND_START_COMPONENT,
      4 + (round - 1) * ROUND_SPEED_STEP
    );
    ball.x = W / 2;
    ball.y = H - 58;
    ball.vx = roundStartComponent * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = -roundStartComponent;
    paddle.x = W / 2 - paddle.w / 2;
    respawnGrace = withGrace ? RESPAWN_GRACE_STEPS : 0;
    if (withGrace) gameStatusEl.textContent = 'Prepare-se...';
  }

  function resetGame() {
    score = 0;
    lives = 3;
    round = 1;
    widePaddleSteps = 0;
    shieldCharges = 0;
    powerDrops = [];
    paddle.w = BASE_PADDLE_WIDTH;
    impactFlash = null;
    paddleFlash = 0;
    roundTransition = 0;
    roundTransitionStatus = '';
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    createBricks();
    resetBall(true);
  }

  function applyPaddleBounce(hit) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const previousDirection = ball.vx < 0 ? -1 : 1;
    const desiredVx = hit * Math.min(5, speed);
    const effectiveMinVerticalSpeed = Math.min(MIN_VERTICAL_SPEED, speed / 2);
    const maxHorizontalSpeed = Math.sqrt(Math.max(
      0,
      speed * speed - effectiveMinVerticalSpeed * effectiveMinVerticalSpeed
    ));
    const horizontalDirection = desiredVx === 0 ? previousDirection : Math.sign(desiredVx);
    const minimumHorizontalVx = MIN_HORIZONTAL_SPEED * horizontalDirection;
    const nextVx = Math.abs(desiredVx) < MIN_HORIZONTAL_SPEED
      ? minimumHorizontalVx
      : desiredVx;

    ball.vx = Math.max(-maxHorizontalSpeed, Math.min(maxHorizontalSpeed, nextVx));
    ball.vy = -Math.sqrt(Math.max(0, speed * speed - ball.vx * ball.vx));
  }

  function accelerateBallAfterBrick() {
    const speed = Math.hypot(ball.vx, ball.vy);
    const maxBallSpeed = window.GameDifficulty.maxBallSpeedForRound(round);
    if (speed === 0 || speed >= maxBallSpeed) return;

    const nextSpeed = Math.min(maxBallSpeed, speed * BRICK_SPEED_MULTIPLIER);
    const scale = nextSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }

  function bounceBallOffBrick(brick, previousX, previousY) {
    const cameFromLeft = previousX + ball.r <= brick.x;
    const cameFromRight = previousX - ball.r >= brick.x + brick.w;
    const cameFromAbove = previousY + ball.r <= brick.y;
    const cameFromBelow = previousY - ball.r >= brick.y + brick.h;

    if (cameFromLeft && ball.vx > 0) {
      ball.x = brick.x - ball.r;
      ball.vx = -Math.abs(ball.vx);
      return;
    }
    if (cameFromRight && ball.vx < 0) {
      ball.x = brick.x + brick.w + ball.r;
      ball.vx = Math.abs(ball.vx);
      return;
    }
    if (cameFromAbove && ball.vy > 0) {
      ball.y = brick.y - ball.r;
      ball.vy = -Math.abs(ball.vy);
      return;
    }
    if (cameFromBelow && ball.vy < 0) {
      ball.y = brick.y + brick.h + ball.r;
      ball.vy = Math.abs(ball.vy);
      return;
    }

    const overlapX = Math.min(
      ball.x + ball.r - brick.x,
      brick.x + brick.w - (ball.x - ball.r)
    );
    const overlapY = Math.min(
      ball.y + ball.r - brick.y,
      brick.y + brick.h - (ball.y - ball.r)
    );

    if (overlapX < overlapY) ball.vx *= -1;
    else ball.vy *= -1;
  }

  function resolveBoundaryCollisions() {
    if (ball.x - ball.r <= 0 && ball.vx < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.r >= W && ball.vx > 0) {
      ball.x = W - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ball.r <= 0 && ball.vy < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }
  }

  function movePaddleTo(x) {
    paddle.x = Math.max(0, Math.min(W - paddle.w, x));
  }

  function movePaddleFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (W / rect.width);
    movePaddleTo(canvasX - paddle.w / 2);
    draw();
  }

  function clearActiveInput() {
    keys.clear();
    pointerActive = false;
  }

  function syncPauseButton() {
    pauseButton.disabled = !running;
    pauseButton.textContent = pausedByPlayer ? 'Retomar' : 'Pausar';
    pauseButton.setAttribute('aria-pressed', pausedByPlayer ? 'true' : 'false');
  }

  function pauseForFocusLoss() {
    clearActiveInput();
    if (!running || pausedByFocusLoss) return;
    pausedByFocusLoss = true;
    gameStatusEl.textContent = 'Pausado.';
  }

  function resumeAfterFocusLoss() {
    if (!pausedByFocusLoss) return;
    pausedByFocusLoss = false;
    lastFrameTime = null;
    gameStatusEl.textContent = pausedByPlayer
      ? 'Pausado.'
      : (roundTransition > 0 ? roundTransitionStatus : (respawnGrace > 0 ? 'Prepare-se...' : ''));
  }

  function togglePlayerPause() {
    if (!running) return;
    pausedByPlayer = !pausedByPlayer;
    clearActiveInput();
    lastFrameTime = null;
    gameStatusEl.textContent = pausedByPlayer
      ? 'Pausado.'
      : (roundTransition > 0 ? roundTransitionStatus : (respawnGrace > 0 ? 'Prepare-se...' : ''));
    syncPauseButton();
  }

  function update(stepScale = 1) {
    if (pausedByFocusLoss || pausedByPlayer) return;

    if (impactFlash) {
      impactFlash.life = Math.max(0, impactFlash.life - stepScale);
      if (impactFlash.life === 0) impactFlash = null;
    }
    paddleFlash = Math.max(0, paddleFlash - stepScale);

    if (roundTransition > 0) {
      roundTransition = Math.max(0, roundTransition - stepScale);
      if (roundTransition === 0) {
        roundTransitionStatus = '';
        createBricks();
        resetBall(true);
      }
      return;
    }

    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) paddle.x -= paddle.speed * stepScale;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) paddle.x += paddle.speed * stepScale;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

    if (respawnGrace > 0) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = H - 58;
      respawnGrace = Math.max(0, respawnGrace - stepScale);
      if (respawnGrace === 0) gameStatusEl.textContent = '';
      return;
    }

    updatePowerUps(stepScale);

    const previousBallX = ball.x;
    const previousBallY = ball.y;
    ball.x += ball.vx * stepScale;
    ball.y += ball.vy * stepScale;

    resolveBoundaryCollisions();

    if (
      ball.vy > 0 &&
      previousBallY + ball.r <= paddle.y &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x + ball.r >= paddle.x &&
      ball.x - ball.r <= paddle.x + paddle.w
    ) {
      ball.y = paddle.y - ball.r;
      const rawHit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const hit = Math.max(-1, Math.min(1, rawHit));
      applyPaddleBounce(hit);
      paddleFlash = PADDLE_FLASH_STEPS;
    }

    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (
        ball.x + ball.r >= brick.x &&
        ball.x - ball.r <= brick.x + brick.w &&
        ball.y + ball.r >= brick.y &&
        ball.y - ball.r <= brick.y + brick.h
      ) {
        brick.alive = false;
        impactFlash = { x: ball.x, y: ball.y, life: IMPACT_FLASH_STEPS };
        spawnPowerDrop(brick);
        bounceBallOffBrick(brick, previousBallX, previousBallY);
        accelerateBallAfterBrick();
        const activeCombo = window.__COMBO_DEBUG__?.getCombo?.() || 0;
        const comboMultiplier = Math.min(MAX_COMBO_MULTIPLIER, activeCombo + 1);
        score += 10 * comboMultiplier;
        scoreEl.textContent = score;
        break;
      }
    }

    if (
      shieldCharges > 0 &&
      ball.vy > 0 &&
      previousBallY + ball.r < SHIELD_Y &&
      ball.y + ball.r >= SHIELD_Y
    ) {
      ball.y = SHIELD_Y - ball.r;
      ball.vy = -Math.abs(ball.vy);
      shieldCharges = 0;
      gameStatusEl.textContent = 'Escudo salvou a bola!';
      syncPhaseHud();
    }

    if (ball.y - ball.r > H) {
      lives -= 1;
      livesEl.textContent = lives;
      if (lives <= 0) {
        clearActivePowers();
        running = false;
        gameStatusEl.textContent = 'Fim de jogo.';
        startButton.textContent = 'Jogar novamente';
        syncPauseButton();
      } else {
        clearActivePowers();
        resetBall(true);
      }
    }

    if (running && bricks.every((brick) => !brick.alive)) {
      const roundClearBonus = lives * ROUND_CLEAR_LIFE_BONUS;
      score += roundClearBonus;
      scoreEl.textContent = score;

      const earnedExtraLife = lives < MAX_LIVES;
      if (earnedExtraLife) {
        lives += 1;
        livesEl.textContent = lives;
      }
      const completedRound = round;
      round += 1;
      syncPaddleWidth();
      syncPhaseHud();
      roundTransition = ROUND_TRANSITION_STEPS;
      roundTransitionStatus = earnedExtraLife
        ? `Rodada ${completedRound} concluída! Bônus +${roundClearBonus}. Vida extra.`
        : `Rodada ${completedRound} concluída! Bônus +${roundClearBonus}.`;
      gameStatusEl.textContent = roundTransitionStatus;
    }
  }

  function drawRoundTransition() {
    if (roundTransition <= 0) return;

    const completedRound = Math.max(1, round - 1);
    const rewardText = roundTransitionStatus.replace(/^Rodada \d+ concluída!\s*/, '');

    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 22, 0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.fillText(`RODADA ${completedRound} CONCLUÍDA`, W / 2, H * 0.44);
    ctx.fillStyle = '#facc15';
    ctx.font = '650 19px system-ui, sans-serif';
    ctx.fillText(rewardText, W / 2, H * 0.52);
    ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillText(`Próxima: rodada ${round}`, W / 2, H * 0.59);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const brick of bricks) {
      if (!brick.alive) continue;
      const hue = 205 + brick.row * 18;
      ctx.fillStyle = brick.powerType === 'wide'
        ? '#22d3ee'
        : (brick.powerType === 'shield' ? '#a78bfa' : `hsl(${hue} 80% 58%)`);
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

      if (brick.powerType) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(brick.powerType === 'wide' ? 'W' : 'S', brick.x + brick.w / 2, brick.y + brick.h / 2 + 0.5);
        ctx.restore();
      }
    }

    if (shieldCharges > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(167, 139, 250, .95)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(18, SHIELD_Y);
      ctx.lineTo(W - 18, SHIELD_Y);
      ctx.stroke();
      ctx.restore();
    }

    for (const drop of powerDrops) {
      ctx.save();
      ctx.fillStyle = drop.type === 'wide' ? '#22d3ee' : '#a78bfa';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, POWER_DROP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drop.type === 'wide' ? 'W' : 'S', drop.x, drop.y + 0.5);
      ctx.restore();
    }

    if (impactFlash) {
      const progress = 1 - impactFlash.life / IMPACT_FLASH_STEPS;
      ctx.save();
      ctx.globalAlpha = impactFlash.life / IMPACT_FLASH_STEPS;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(impactFlash.x, impactFlash.y, ball.r + 5 + progress * 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    if (paddleFlash > 0) {
      const intensity = paddleFlash / PADDLE_FLASH_STEPS;
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 18 * intensity;
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#f8fafc';
    }
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();

    drawRoundTransition();
  }

  function frame(timestamp) {
    if (!running) {
      lastFrameTime = null;
      draw();
      return;
    }

    if (pausedByFocusLoss || pausedByPlayer) {
      lastFrameTime = null;
      draw();
      rafId = requestAnimationFrame(frame);
      return;
    }

    const stepScale = lastFrameTime === null
      ? 1
      : Math.min(MAX_FRAME_STEP, Math.max(0, (timestamp - lastFrameTime) / TARGET_FRAME_MS));
    lastFrameTime = timestamp;

    update(stepScale);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    clearActiveInput();
    pausedByFocusLoss = false;
    pausedByPlayer = false;
    gameStatusEl.textContent = '';
    resetGame();
    running = true;
    lastFrameTime = null;
    startButton.textContent = 'Reiniciar';
    syncPauseButton();
    frame(performance.now());
  }

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      togglePlayerPause();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault();
    keys.add(event.key);
  });
  document.addEventListener('keyup', (event) => keys.delete(event.key));
  window.addEventListener('blur', pauseForFocusLoss);
  window.addEventListener('focus', resumeAfterFocusLoss);
  window.addEventListener('pagehide', pauseForFocusLoss);
  window.addEventListener('pageshow', () => {
    if (document.hasFocus()) resumeAfterFocusLoss();
  });
  startButton.addEventListener('click', start);
  pauseButton.addEventListener('click', togglePlayerPause);

  canvas.addEventListener('pointerdown', (event) => {
    if (!running || pausedByPlayer) return;
    if (pausedByFocusLoss) resumeAfterFocusLoss();
    pointerActive = true;
    canvas.setPointerCapture?.(event.pointerId);
    movePaddleFromPointer(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    const dragging = pointerActive || event.buttons === 1;
    if (!dragging || !running || pausedByPlayer) return;
    if (pausedByFocusLoss) resumeAfterFocusLoss();
    pointerActive = true;
    movePaddleFromPointer(event);
  });
  canvas.addEventListener('pointerup', () => { pointerActive = false; });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; });

  createBricks();
  syncPauseButton();
  draw();

  window.__GAME_DEBUG__ = {
    getState() {
      return {
        running,
        score,
        lives,
        round,
        paddle: { ...paddle },
        ball: { ...ball },
        bricksRemaining: bricks.filter((brick) => brick.alive).length,
        brickLayout: brickLayoutForRound(),
        brickLayoutLabel: layoutLabel(),
        powerDrops: powerDrops.map((drop) => ({ ...drop })),
        widePaddleSteps,
        shieldCharges,
        respawnGrace,
        roundTransition,
        roundTransitionStatus,
        pausedByFocusLoss,
        pausedByPlayer,
        impactFlash: impactFlash ? { ...impactFlash } : null,
        paddleFlash
      };
    },
    start,
    movePaddleTo(x) {
      movePaddleTo(x);
      draw();
    },
    bounceBallOffPaddle(hit = 0) {
      applyPaddleBounce(Math.max(-1, Math.min(1, hit)));
      draw();
    },
    setBall(nextBall) {
      Object.assign(ball, nextBall);
      draw();
    },
    setRoundForTest(nextRound) {
      if (!Number.isInteger(nextRound) || nextRound < 1) return false;
      round = nextRound;
      clearActivePowers();
      syncPaddleWidth();
      roundTransition = 0;
      roundTransitionStatus = '';
      createBricks();
      resetBall(false);
      draw();
      return true;
    },
    step(stepScale = 1) {
      update(stepScale);
      draw();
    },
    clearBricksExcept(indexToKeep = 0) {
      bricks.forEach((brick, index) => {
        brick.alive = index === indexToKeep;
      });
      draw();
    },
    getBricks() {
      return bricks.map((brick) => ({ ...brick }));
    },
    spawnPowerDropForTest(type, x = paddle.x + paddle.w / 2, y = paddle.y - 80) {
      if (type !== 'wide' && type !== 'shield') return false;
      powerDrops.push({ type, x, y, vy: POWER_DROP_SPEED });
      draw();
      return true;
    }
  };
})();