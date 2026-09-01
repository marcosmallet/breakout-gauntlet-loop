const { test, expect } = require('@playwright/test');

test('carrega o jogo com o estado inicial esperado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toBeVisible();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.bricksRemaining).toBe(50);
});

test('canvas associa instruções de controle para tecnologias assistivas', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('#game');
  await expect(canvas).toHaveAttribute('aria-describedby', 'controlInstructions');
  await expect(page.locator('#controlInstructions')).toHaveText(
    'Use ← →, A/D ou arraste sobre o jogo para mover a raquete. Pressione Espaço ou use o botão Pausar para pausar ou retomar.'
  );
});

test('hud anuncia mudanças de pontos e vidas para tecnologias assistivas', async ({ page }) => {
  await page.goto('/');

  const hud = page.locator('.hud');
  await expect(hud).toHaveAttribute('aria-live', 'polite');
  await expect(hud).toHaveAttribute('aria-atomic', 'true');
  await expect(hud).toContainText('Pontos: 0');
  await expect(hud).toContainText('Vidas: 3');
});

test('inicia uma partida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);
  expect(state.respawnGrace).toBeGreaterThan(0);
});

test('início concede tempo para posicionar a raquete antes do lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    const initial = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.movePaddleTo(600);
    window.__GAME_DEBUG__.step();
    const duringGrace = window.__GAME_DEBUG__.getState();
    return { initial, duringGrace };
  });

  expect(states.initial.respawnGrace).toBeGreaterThan(0);
  expect(states.duringGrace.ball.x).toBe(
    states.duringGrace.paddle.x + states.duringGrace.paddle.w / 2
  );
  expect(states.duringGrace.ball.y).toBe(states.initial.ball.y);
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

test('espaço pausa e retoma a partida sem avançar a bola', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const states = await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }
    window.__GAME_DEBUG__.setBall({ x: 400, y: 300, vx: 4, vy: -4 });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
      cancelable: true
    }));
    const paused = window.__GAME_DEBUG__.getState();
    window.__GAME_DEBUG__.step();
    const whilePaused = window.__GAME_DEBUG__.getState();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
      cancelable: true
    }));
    window.__GAME_DEBUG__.step();
    const resumed = window.__GAME_DEBUG__.getState();

    return { paused, whilePaused, resumed };
  });

  expect(states.paused.pausedByPlayer).toBe(true);
  expect(states.whilePaused.ball.x).toBe(states.paused.ball.x);
  expect(states.whilePaused.ball.y).toBe(states.paused.ball.y);
  expect(states.resumed.pausedByPlayer).toBe(false);
  expect(states.resumed.ball.x).toBeGreaterThan(states.whilePaused.ball.x);
  expect(states.resumed.ball.y).toBeLessThan(states.whilePaused.ball.y);
});

test('botão de pausa permite pausar e retomar em dispositivos de toque', async ({ page }) => {
  await page.goto('/');
  const pauseButton = page.getByRole('button', { name: 'Pausar' });
  await expect(pauseButton).toBeDisabled();

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(pauseButton).toBeEnabled();

  await pauseButton.click();
  await expect(page.getByRole('button', { name: 'Retomar' })).toHaveAttribute('aria-pressed', 'true');
  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).pausedByPlayer).toBe(true);

  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const paddleBeforeDrag = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await page.mouse.up();
  const paddleAfterDrag = await page.evaluate(() => window.__GAME_DEBUG__.getState().paddle.x);
  expect(paddleAfterDrag).toBe(paddleBeforeDrag);

  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(page.getByRole('button', { name: 'Pausar' })).toHaveAttribute('aria-pressed', 'false');
  expect((await page.evaluate(() => window.__GAME_DEBUG__.getState())).pausedByPlayer).toBe(false);
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

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const activeState = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(activeState.running).toBe(true);
  expect(activeState.pausedByFocusLoss).toBe(false);
  expect(activeState.pausedByPlayer).toBe(false);

  const before = activeState.paddle.x;
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
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
    window.__GAME_DEBUG__.step();
    const afterLoss = window.__GAME_DEBUG__.getState();

    window.__GAME_DEBUG__.movePaddleTo(600);
    window.__GAME_DEBUG__.step();
    const duringGrace = window.__GAME_DEBUG__.getState();

    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
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
  expect(states.duringGrace.respawnGrace).toBeLessThan(states.afterLoss.respawnGrace);
  expect(states.beforeLaunch.respawnGrace).toBe(0);
  expect(states.afterLaunch.ball.y).toBeLessThan(states.beforeLaunch.ball.y);
});

test('fim de jogo exibe resultado acessível ao jogador', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  await page.evaluate(() => {
    while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
      window.__GAME_DEBUG__.step();
    }

    for (let life = 0; life < 3; life += 1) {
      window.__GAME_DEBUG__.setBall({ y: 540, vy: 4 });
      window.__GAME_DEBUG__.step();
      if (life < 2) {
        while (window.__GAME_DEBUG__.getState().respawnGrace > 0) {
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
