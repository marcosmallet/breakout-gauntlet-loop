const { test, expect } = require('@playwright/test');

async function drainGrace(page) {
  await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    while (game.getState().respawnGrace > 0) game.step();
  });
}

test('round clear expira drops pendentes sem remover poderes já coletados', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await drainGrace(page);

  const result = await page.evaluate(() => {
    const game = window.__GAME_DEBUG__;
    const initial = game.getState();

    // Um poder coletado pertence ao jogador e deve atravessar a fronteira de rodada.
    game.spawnPowerDropForTest(
      'shield',
      initial.paddle.x + initial.paddle.w / 2,
      initial.paddle.y - 12
    );
    game.setBall({ x: 400, y: 300, vx: 0, vy: 0 });
    game.step();
    const armed = game.getState();

    // Em R1 o índice 10 é o bloco W. Ao torná-lo o último bloco, destruí-lo
    // cria um drop no mesmo update que conclui a rodada.
    game.clearBricksExcept(10);
    const finalBrick = game.getBricks()[10];
    game.setBall({
      x: finalBrick.x - 9,
      y: finalBrick.y + finalBrick.h / 2,
      vx: 4,
      vy: 0
    });
    game.step();

    return {
      armed,
      cleared: game.getState()
    };
  });

  expect(result.armed.shieldCharges).toBe(1);
  expect(result.cleared.round).toBe(2);
  expect(result.cleared.roundTransition).toBeGreaterThan(0);
  expect(result.cleared.powerDrops).toEqual([]);
  expect(result.cleared.shieldCharges).toBe(1);
});
