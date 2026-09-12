const { test, expect } = require('@playwright/test');

test('destruir bloco dispara feedback sonoro uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#score')).toHaveText('10');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getImpactCount())).toBe(1);
});

test('combo crescente eleva o tom dos impactos', async ({ page }) => {
  await page.goto('/');

  const frequencies = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);

    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    const first = sound.getLastImpactFrequency();

    game.setBall({ x: 120, y: 45, vx: 0, vy: 5 });
    game.step();
    await Promise.resolve();
    const second = sound.getLastImpactFrequency();

    return { first, second };
  });

  await expect(page.locator('#combo')).toHaveText('x2');
  expect(frequencies.first).toBe(420);
  expect(frequencies.second).toBe(475);
});

test('rebater na raquete dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 400, y: 470, vx: 0, vy: 6 });
    game.step();
  });

  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getPaddleImpactCount())).toBe(1);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.getState().ball.vy)).toBeLessThan(0);
});

test('rebater na parede dispara feedback sonoro sutil uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 9, y: 260, vx: -5, vy: -2 });
    game.step();
  });

  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getWallImpactCount())).toBe(1);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.getState().ball.vx)).toBeGreaterThan(0);
});

test('perder vida dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#lives')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getLifeLossCount())).toBe(1);
  expect(await page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getGameOverCount())).toBe(0);
});

test('perder a última vida dispara som de game over em vez do som comum', async ({ page }) => {
  await page.goto('/');

  const finalState = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);

    for (let remainingLives = 2; remainingLives >= 0; remainingLives -= 1) {
      game.setBall({ x: 400, y: 540, vx: 0, vy: 5 });
      game.step();
      await Promise.resolve();
      if (remainingLives > 0) game.step(45);
    }

    return game.getState();
  });

  await expect(page.locator('#lives')).toHaveText('0');
  await expect(page.locator('#gameStatus')).toHaveText(
    `Fim de jogo. ${finalState.score} pontos • Rodada ${finalState.round}.`
  );
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getLifeLossCount())).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getGameOverCount())).toBe(1);
});

test('avançar de rodada dispara feedback sonoro próprio uma vez', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    game.start();
    game.step(45);
    game.clearBricksExcept(0);
    game.setBall({ x: 50, y: 45, vx: 0, vy: 5 });
    game.step();
  });

  await expect(page.locator('#round')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => window.__IMPACT_SOUND_DEBUG__.getRoundAdvanceCount())).toBe(1);
});

test('coletar power dispara confirmação sonora própria uma vez', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);
    const before = game.getState();
    const emittedBefore = sound.getEmittedSoundCount();
    game.spawnPowerDropForTest('wide', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    await Promise.resolve();
    return {
      pickupCount: sound.getPowerPickupCount(),
      emittedDelta: sound.getEmittedSoundCount() - emittedBefore,
      widePaddleSteps: game.getState().widePaddleSteps,
      status: document.getElementById('gameStatus').textContent
    };
  });

  expect(result.pickupCount).toBe(1);
  expect(result.emittedDelta).toBe(1);
  expect(result.widePaddleSteps).toBeGreaterThan(0);
  expect(result.status).toBe('Poder coletado: Raquete larga!');
});

test('mute preserva a coleta do power sem emitir áudio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar som do jogo' }).click();

  const result = await page.evaluate(async () => {
    const game = window.__GAME_DEBUG__;
    const sound = window.__IMPACT_SOUND_DEBUG__;
    game.start();
    game.step(45);
    const before = game.getState();
    const emittedBefore = sound.getEmittedSoundCount();
    game.spawnPowerDropForTest('shield', before.paddle.x + before.paddle.w / 2, before.paddle.y - 12);
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    await Promise.resolve();
    return {
      pickupCount: sound.getPowerPickupCount(),
      emittedDelta: sound.getEmittedSoundCount() - emittedBefore,
      shieldCharges: game.getState().shieldCharges,
      muted: sound.isMuted()
    };
  });

  expect(result.pickupCount).toBe(1);
  expect(result.emittedDelta).toBe(0);
  expect(result.shieldCharges).toBe(1);
  expect(result.muted).toBe(true);
});
