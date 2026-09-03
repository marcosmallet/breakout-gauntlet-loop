const { test, expect } = require('@playwright/test');

test('rastro acompanha o movimento da bola sem afetar a simulação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const trail = window.__BALL_TRAIL_DEBUG__;

    game.step(60);
    trail.refresh();
    const before = game.getState().ball;

    for (let index = 0; index < 6; index += 1) {
      game.step();
      trail.refresh();
    }

    const after = game.getState().ball;
    return {
      before,
      after,
      trailLength: trail.getTrailLength(),
      activeTrailLimit: trail.getActiveTrailLimit(),
      maxTrailPoints: trail.getMaxTrailPoints()
    };
  });

  expect(result.after.x).not.toBe(result.before.x);
  expect(result.after.y).not.toBe(result.before.y);
  expect(result.trailLength).toBeGreaterThan(1);
  expect(result.trailLength).toBeLessThanOrEqual(result.activeTrailLimit);
  expect(result.activeTrailLimit).toBeGreaterThanOrEqual(4);
  expect(result.maxTrailPoints).toBe(8);
});

test('rastro fica mais longo conforme a velocidade da bola aumenta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const trail = window.__BALL_TRAIL_DEBUG__;

    game.step(60);
    game.setBall({ x: 300, y: 300, vx: 4, vy: -4 });
    for (let index = 0; index < 10; index += 1) {
      game.step();
      trail.refresh();
    }
    const base = {
      length: trail.getTrailLength(),
      limit: trail.getActiveTrailLimit()
    };

    game.setBall({ x: 300, y: 300, vx: 8, vy: 0 });
    for (let index = 0; index < 12; index += 1) {
      game.step();
      trail.refresh();
    }
    const fast = {
      length: trail.getTrailLength(),
      limit: trail.getActiveTrailLimit()
    };

    return { base, fast };
  });

  expect(result.base.limit).toBe(4);
  expect(result.base.length).toBe(4);
  expect(result.fast.limit).toBe(8);
  expect(result.fast.length).toBe(8);
});

test('countdown 3-2-1 acompanha a janela de preparação antes do lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const values = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const trail = window.__BALL_TRAIL_DEBUG__;
    const countdown = [];

    trail.refresh();
    countdown.push(trail.getCountdownValue());

    game.step(15);
    trail.refresh();
    countdown.push(trail.getCountdownValue());

    game.step(15);
    trail.refresh();
    countdown.push(trail.getCountdownValue());

    game.step(15);
    trail.refresh();
    countdown.push(trail.getCountdownValue());

    return countdown;
  });

  expect(values).toEqual([3, 2, 1, null]);
});

test('popup mostra os pontos ganhos no local do impacto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const trail = window.__BALL_TRAIL_DEBUG__;

    game.step(60);
    trail.refresh();
    game.clearBricksExcept(0);
    game.setBall({ x: 50, y: 49, vx: 0, vy: 4 });
    game.step();
    trail.refresh();

    return {
      score: game.getState().score,
      popup: trail.getScorePopup()
    };
  });

  expect(result.score).toBe(310);
  expect(result.popup).not.toBeNull();
  expect(result.popup.value).toBe(10);
  expect(result.popup.life).toBeGreaterThan(0);
});