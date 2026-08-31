const { test, expect } = require('@playwright/test');

test('carrega o jogo com o estado inicial esperado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toBeVisible();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.bricksRemaining).toBe(50);
});

test('inicia uma partida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);
});

test('controle para a direita move a raquete', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowRight');

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
});

test('perder foco limpa teclas de movimento presas', async ({ page }) => {
  await page.goto('/');

  const positions = await page.evaluate(() => {
    const before = window.__GAME_DEBUG__.getState().paddle.x;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    window.__GAME_DEBUG__.step();
    const afterKeyDown = window.__GAME_DEBUG__.getState().paddle.x;

    window.dispatchEvent(new Event('blur'));
    window.__GAME_DEBUG__.step();
    const afterBlur = window.__GAME_DEBUG__.getState().paddle.x;

    return { before, afterKeyDown, afterBlur };
  });

  expect(positions.afterKeyDown).toBeGreaterThan(positions.before);
  expect(positions.afterBlur).toBe(positions.afterKeyDown);
});

test('setas de controle não acionam comportamento padrão da página', async ({ page }) => {
  await page.goto('/');

  const prevented = await page.evaluate(() => {
    let defaultPrevented = false;
    const observer = (event) => {
      if (event.key === 'ArrowRight') defaultPrevented = event.defaultPrevented;
    };
    document.addEventListener('keydown', observer);
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true
    }));
    document.removeEventListener('keydown', observer);
    return defaultPrevented;
  });

  expect(prevented).toBe(true);
});

test('rebatida central mantém movimento horizontal mínimo', async ({ page }) => {
  await page.goto('/');

  const velocity = await page.evaluate(() => {
    window.__GAME_DEBUG__.bounceBallOffPaddle(0);
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(Math.abs(velocity.vx)).toBeGreaterThanOrEqual(1.5);
  expect(velocity.vy).toBeLessThan(0);
});

test('rebatida na raquete preserva a velocidade total da bola', async ({ page }) => {
  await page.goto('/');

  const speeds = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ vx: 4, vy: 4 });
    const before = window.__GAME_DEBUG__.getState().ball;
    const beforeSpeed = Math.hypot(before.vx, before.vy);

    window.__GAME_DEBUG__.bounceBallOffPaddle(1);
    const after = window.__GAME_DEBUG__.getState().ball;
    return {
      beforeSpeed,
      afterSpeed: Math.hypot(after.vx, after.vy),
      vy: after.vy
    };
  });

  expect(speeds.afterSpeed).toBeCloseTo(speeds.beforeSpeed, 8);
  expect(speeds.vy).toBeLessThan(0);
});

test('arrastar no canvas move a raquete', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const before = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await page.mouse.up();

  const after = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(after).toBeGreaterThan(before);
});

test('raspada na borda da raquete rebate a bola', async ({ page }) => {
  await page.goto('/');

  const ballAfter = await page.evaluate(() => {
    const { paddle, ball } = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.setBall({
      x: paddle.x - ball.r + 1,
      y: paddle.y - ball.r - 4,
      vx: 0,
      vy: 4
    });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(ballAfter.vy).toBeLessThan(0);
  expect(Math.abs(ballAfter.vx)).toBeLessThanOrEqual(5);
});

test('colisão lateral com bloco inverte o movimento horizontal', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({
      x: 21.6,
      y: 69,
      vx: 4,
      vy: 0
    });
    window.__GAME_DEBUG__.step();
    return window.__GAME_DEBUG__.getState();
  });

  expect(result.ball.vx).toBeLessThan(0);
  expect(result.ball.vy).toBe(0);
  expect(result.score).toBe(10);
  expect(result.bricksRemaining).toBe(49);
});

test('destruir bloco aumenta gradualmente a velocidade da bola', async ({ page }) => {
  await page.goto('/');

  const speeds = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({
      x: 21.6,
      y: 69,
      vx: 4,
      vy: 0
    });
    const before = window.__GAME_DEBUG__.getState().ball;
    const beforeSpeed = Math.hypot(before.vx, before.vy);

    window.__GAME_DEBUG__.step();
    const after = window.__GAME_DEBUG__.getState().ball;
    return {
      beforeSpeed,
      afterSpeed: Math.hypot(after.vx, after.vy)
    };
  });

  expect(speeds.afterSpeed).toBeGreaterThan(speeds.beforeSpeed);
  expect(speeds.afterSpeed).toBeLessThanOrEqual(8);
});

test('perder uma vida concede tempo para reposicionar a raquete', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
    window.__GAME_DEBUG__.step();
    const afterLoss = window.__GAME_DEBUG__.getState();

    window.__GAME_DEBUG__.movePaddleTo(600);
    window.__GAME_DEBUG__.step();
    const duringGrace = window.__GAME_DEBUG__.getState();

    for (let step = 0; step < 44; step += 1) {
      window.__GAME_DEBUG__.step();
    }
    const beforeLaunch = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.step();
    const afterLaunch = window.__GAME_DEBUG__.getState();

    return { afterLoss, duringGrace, beforeLaunch, afterLaunch };
  });

  expect(states.afterLoss.lives).toBe(2);
  expect(states.afterLoss.respawnGrace).toBe(45);
  expect(states.duringGrace.ball.x).toBe(states.duringGrace.paddle.x + states.duringGrace.paddle.w / 2);
  expect(states.duringGrace.respawnGrace).toBe(44);
  expect(states.beforeLaunch.respawnGrace).toBe(0);
  expect(states.afterLaunch.ball.y).toBeLessThan(states.beforeLaunch.ball.y);
});

test('fim de jogo exibe resultado acessível ao jogador', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    for (let life = 0; life < 3; life += 1) {
      window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
      window.__GAME_DEBUG__.step();
      if (life < 2) {
        for (let step = 0; step < 45; step += 1) {
          window.__GAME_DEBUG__.step();
        }
      }
    }
  });

  await expect(page.getByRole('status')).toHaveText('Fim de jogo.');
  await expect(page.getByRole('button', { name: 'Jogar novamente' })).toBeVisible();
});

test('movimento respeita a fração de frame normalizada', async ({ page }) => {
  await page.goto('/');

  const ballAfter = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ x: 400, y: 300, vx: 4, vy: 2 });
    window.__GAME_DEBUG__.step(0.5);
    return window.__GAME_DEBUG__.getState().ball;
  });

  expect(ballAfter.x).toBeCloseTo(402, 8);
  expect(ballAfter.y).toBeCloseTo(301, 8);
});

test('colisão com parede resolve overshoot sem inverter novamente no frame seguinte', async ({ page }) => {
  await page.goto('/');

  const states = await page.evaluate(() => {
    window.__GAME_DEBUG__.setBall({ x: 12, y: 300, vx: -8, vy: 0 });
    window.__GAME_DEBUG__.step(2);
    const afterBounce = window.__GAME_DEBUG__.getState().ball;
    window.__GAME_DEBUG__.step();
    const afterNextFrame = window.__GAME_DEBUG__.getState().ball;
    return { afterBounce, afterNextFrame };
  });

  expect(states.afterBounce.x).toBe(states.afterBounce.r);
  expect(states.afterBounce.vx).toBeGreaterThan(0);
  expect(states.afterNextFrame.x).toBeGreaterThan(states.afterBounce.x);
  expect(states.afterNextFrame.vx).toBeGreaterThan(0);
});