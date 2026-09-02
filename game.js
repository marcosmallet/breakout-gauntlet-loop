(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const gameStatusEl = document.getElementById('gameStatus');

  const W = canvas.width;
  const H = canvas.height;
  const MIN_HORIZONTAL_SPEED = 1.5;
  const MIN_VERTICAL_SPEED = 1.5;
  const BRICK_SPEED_MULTIPLIER = 1.012;
  const MAX_BALL_SPEED = 8;
  const ROUND_SPEED_STEP = 0.25;
  const MAX_ROUND_START_COMPONENT = 5;
  const MAX_LIVES = 5;
  const TARGET_FRAME_MS = 1000 / 60;
  const MAX_FRAME_STEP = 2;
  const RESPAWN_GRACE_STEPS = 45;
  const IMPACT_FLASH_STEPS = 8;
  const PADDLE_FLASH_STEPS = 6;

  const paddle = { x: W / 2 - 55, y: H - 38, w: 110, h: 14, speed: 8 };
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
  let pausedByFocusLoss = false;
  let pausedByPlayer = false;
  let impactFlash = null;
  let paddleFlash = 0;

  function createBricks() {
    const rows = 5;
    const cols = 10;
    const gap = 8;
    const margin = 32;
    const brickW = (W - margin * 2 - gap * (cols - 1)) / cols;
    const brickH = 22;
    bricks = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        bricks.push({
          x: margin + col * (brickW + gap),
          y: 58 + row * (brickH + gap),
          w: brickW,
          h: brickH,
          alive: true,
          row
        });
      }
    }
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
    impactFlash = null;
    paddleFlash = 0;
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
    if (speed === 0 || speed >= MAX_BALL_SPEED) return;

    const nextSpeed = Math.min(MAX_BALL_SPEED, speed * BRICK_SPEED_MULTIPLIER);
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
      : (respawnGrace > 0 ? 'Prepare-se...' : '');
  }

  function togglePlayerPause() {
    if (!running) return;
    pausedByPlayer = !pausedByPlayer;
    clearActiveInput();
    lastFrameTime = null;
    gameStatusEl.textContent = pausedByPlayer
      ? 'Pausado.'
      : (respawnGrace > 0 ? 'Prepare-se...' : '');
    syncPauseButton();
  }

  function update(stepScale = 1) {
    if (pausedByFocusLoss || pausedByPlayer) return;

    if (impactFlash) {
      impactFlash.life = Math.max(0, impactFlash.life - stepScale);
      if (impactFlash.life === 0) impactFlash = null;
    }
    paddleFlash = Math.max(0, paddleFlash - stepScale);

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
        bounceBallOffBrick(brick, previousBallX, previousBallY);
        accelerateBallAfterBrick();
        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }

    if (ball.y - ball.r > H) {
      lives -= 1;
      livesEl.textContent = lives;
      if (lives <= 0) {
        running = false;
        gameStatusEl.textContent = 'Fim de jogo.';
        startButton.textContent = 'Jogar novamente';
        syncPauseButton();
      } else {
        resetBall(true);
      }
    }

    if (running && bricks.every((brick) => !brick.alive)) {
      const earnedExtraLife = lives < MAX_LIVES;
      if (earnedExtraLife) {
        lives += 1;
        livesEl.textContent = lives;
      }
      round += 1;
      createBricks();
      resetBall(true);
      gameStatusEl.textContent = earnedExtraLife
        ? `Rodada ${round}! Vida extra.`
        : `Rodada ${round}!`;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const brick of bricks) {
      if (!brick.alive) continue;
      const hue = 205 + brick.row * 18;
      ctx.fillStyle = `hsl(${hue} 80% 58%)`;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
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
        respawnGrace,
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
    step(stepScale = 1) {
      update(stepScale);
      draw();
    },
    clearBricksExcept(indexToKeep = 0) {
      bricks.forEach((brick, index) => {
        brick.alive = index === indexToKeep;
      });
      draw();
    }
  };
})();