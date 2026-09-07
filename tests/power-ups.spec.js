const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

test('cada rodada preserva W/S e adiciona um bônus P/G determinístico', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    return [1, 2, 3, 4].map((round) => {
      game.setRoundForTest(round);
      const powers = game.getBricks()
        .map((brick, index) => ({ index, type: brick.powerType }))
        .filter((brick) => brick.type);
      return { round, powers };
    });
  });

  for (const round of result) {
    const types = round.powers.map((power) => power.type);
    expect(round.powers).toHaveLength(3);
    expect(types).toContain('wide');
    expect(types).toContain('shield');
    expect(types.filter((type) => type !== 'wide' && type !== 'shield')).toEqual([
      round.round % 2 === 1 ? 'pierce' : 'giant'
    ]);
    expect(new Set(round.powers.map((power) => power.index)).size).toBe(3);
  }
});

test('destruir bloco especial cria o drop correspondente', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const brick = game.getBricks().find((candidate) => candidate.powerType === 'wide');
    game.setBall({
      x: brick.x - 9,
      y: brick.y + brick.h / 2,
      vx: 4,
      vy: 0
    });
    game.step();
    return game.getState();
  });

  expect(result.powerDrops.some((drop) => drop.type === 'wide')).toBe(true);
});

test('W amplia a raquete temporariamente e atualiza o HUD', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('wide', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const active = game.getState();
    game.step(active.widePaddleSteps);
    const expired = game.getState();
    return { before, active, expired, hud: document.getElementById('powerStatus').textContent };
  });

  expect(result.active.paddle.w).toBe(result.before.paddle.w + 34);
  expect(result.active.widePaddleSteps).toBeGreaterThan(0);
  expect(result.expired.widePaddleSteps).toBe(0);
  expect(result.expired.paddle.w).toBe(result.before.paddle.w);
  expect(result.hud).toBe('—');
});

test('S salva uma bola perdida exatamente uma vez', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('shield', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 40, y: 300, vx: 0, vy: 0 });
    game.step();
    const armed = game.getState();

    game.setBall({ x: 40, y: 490, vx: 0, vy: 8 });
    game.step(2);
    const saved = game.getState();

    return { before, armed, saved, status: document.getElementById('gameStatus').textContent };
  });

  expect(result.armed.shieldCharges).toBe(1);
  expect(result.saved.lives).toBe(result.before.lives);
  expect(result.saved.shieldCharges).toBe(0);
  expect(result.saved.ball.vy).toBeLessThan(0);
  expect(result.status).toBe('Escudo salvou a bola!');
});

test('perder uma vida remove poderes ativos e drops pendentes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('wide', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const powered = game.getState();

    game.spawnPowerDropForTest('shield', 40, 120);
    game.setBall({ x: 40, y: 540, vx: 0, vy: 4 });
    game.step();
    const afterLoss = game.getState();
    return { before, powered, afterLoss };
  });

  expect(result.powered.widePaddleSteps).toBeGreaterThan(0);
  expect(result.afterLoss.lives).toBe(result.before.lives - 1);
  expect(result.afterLoss.widePaddleSteps).toBe(0);
  expect(result.afterLoss.shieldCharges).toBe(0);
  expect(result.afterLoss.powerDrops).toHaveLength(0);
});


test('P atravessa três blocos sem inverter a trajetória', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('pierce', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const armed = game.getState();

    const brick = game.getBricks().find((candidate) => candidate.alive && !candidate.powerType);
    game.setBall({ x: brick.x - 9, y: brick.y + brick.h / 2, vx: 4, vy: 0 });
    game.step();
    const afterHit = game.getState();
    return { armed, afterHit };
  });

  expect(result.armed.pierceHits).toBe(3);
  expect(result.afterHit.pierceHits).toBe(2);
  expect(result.afterHit.ball.vx).toBeGreaterThan(0);
  expect(result.afterHit.bricksRemaining).toBe(result.armed.bricksRemaining - 1);
});

test('G amplia a bola temporariamente sem alterar sua velocidade', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const before = game.getState();
    game.spawnPowerDropForTest('giant', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 3, vy: -4 });
    game.step();
    const active = game.getState();
    const activeSpeed = Math.hypot(active.ball.vx, active.ball.vy);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step(active.giantBallSteps);
    const expired = game.getState();
    return {
      beforeRadius: before.ball.r,
      activeRadius: active.ball.r,
      activeSpeed,
      giantBallSteps: active.giantBallSteps,
      expiredRadius: expired.ball.r,
      expiredSteps: expired.giantBallSteps
    };
  });

  expect(result.beforeRadius).toBe(8);
  expect(result.activeRadius).toBe(12);
  expect(result.activeSpeed).toBeCloseTo(5, 5);
  expect(result.giantBallSteps).toBeGreaterThan(0);
  expect(result.expiredRadius).toBe(8);
  expect(result.expiredSteps).toBe(0);
});
