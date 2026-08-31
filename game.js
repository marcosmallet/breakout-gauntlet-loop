(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const startButton = document.getElementById('startButton');

  const W = canvas.width;
  const H = canvas.height;
  const MIN_HORIZONTAL_SPEED = 1.5;

  const paddle = { x: W / 2 - 55, y: H - 38, w: 110, h: 14, speed: 8 };
  const ball = { x: W / 2, y: H - 58, r: 8, vx: 4, vy: -4 };
  const keys = new Set();

  let score = 0;
  let lives = 3;
  let running = false;
  let rafId = null;
  let bricks = [];
  let pointerActive = false;

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

  function resetBall() {
    ball.x = W / 2;
    ball.y = H - 58;
    ball.vx = 4 * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = -4;
    paddle.x = W / 2 - paddle.w / 2;
  }

  function resetGame() {
    score = 0;
    lives = 3;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    createBricks();
    resetBall();
  }

  function applyPaddleBounce(hit) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const previousDirection = ball.vx < 0 ? -1 : 1;
    const nextVx = hit * Math.min(5, speed);
    ball.vx = Math.abs(nextVx) < MIN_HORIZONTAL_SPEED
      ? MIN_HORIZONTAL_SPEED * previousDirection
      : nextVx;
    ball.vy = -Math.sqrt(Math.max(0, speed * speed - ball.vx * ball.vx));
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

  function movePaddleTo(x) {
    paddle.x = Math.max(0, Math.min(W - paddle.w, x));
  }

  function movePaddleFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (W / rect.width);
    movePaddleTo(canvasX - paddle.w / 2);
    draw();
  }

  function update() {
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) paddle.x -= paddle.speed;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

    const previousBallX = ball.x;
    const previousBallY = ball.y;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) ball.vx *= -1;
    if (ball.y - ball.r <= 0) ball.vy *= -1;

    if (
      ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x + ball.r >= paddle.x &&
      ball.x - ball.r <= paddle.x + paddle.w
    ) {
      ball.y = paddle.y - ball.r;
      const rawHit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const hit = Math.max(-1, Math.min(1, rawHit));
      applyPaddleBounce(hit);
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
        bounceBallOffBrick(brick, previousBallX, previousBallY);
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
        startButton.textContent = 'Jogar novamente';
      } else {
        resetBall();
      }
    }

    if (bricks.every((brick) => !brick.alive)) {
      running = false;
      startButton.textContent = 'Jogar novamente';
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

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
  }

  function frame() {
    if (!running) {
      draw();
      return;
    }
    update();
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    resetGame();
    running = true;
    startButton.textContent = 'Reiniciar';
    frame();
  }

  document.addEventListener('keydown', (event) => keys.add(event.key));
  document.addEventListener('keyup', (event) => keys.delete(event.key));
  startButton.addEventListener('click', start);

  canvas.addEventListener('pointerdown', (event) => {
    pointerActive = true;
    canvas.setPointerCapture?.(event.pointerId);
    movePaddleFromPointer(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (pointerActive) movePaddleFromPointer(event);
  });
  canvas.addEventListener('pointerup', () => { pointerActive = false; });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; });

  createBricks();
  draw();

  window.__GAME_DEBUG__ = {
    getState() {
      return {
        running,
        score,
        lives,
        paddle: { ...paddle },
        ball: { ...ball },
        bricksRemaining: bricks.filter((brick) => brick.alive).length
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
    step() {
      update();
      draw();
    }
  };
})();