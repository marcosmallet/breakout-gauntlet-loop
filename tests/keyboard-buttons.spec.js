const { test, expect } = require('@playwright/test');

test('Espaço preserva a ativação nativa dos botões do jogo', async ({ page }) => {
  await page.goto('/');

  const startButton = page.getByRole('button', { name: 'Iniciar' });
  await startButton.focus();
  await page.keyboard.press('Space');

  let state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.running).toBe(true);

  const pauseButton = page.getByRole('button', { name: 'Pausar' });
  await pauseButton.focus();
  await page.keyboard.press('Space');

  state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.pausedByPlayer).toBe(true);
  await expect(page.getByRole('button', { name: 'Retomar' })).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Space');
  state = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  expect(state.pausedByPlayer).toBe(false);
  await expect(page.getByRole('button', { name: 'Pausar' })).toHaveAttribute('aria-pressed', 'false');
});

test('controles exibem foco visível para navegação por teclado', async ({ page }) => {
  await page.goto('/');

  const startButton = page.getByRole('button', { name: 'Iniciar' });
  await page.keyboard.press('Tab');
  await expect(startButton).toBeFocused();

  const focusStyle = await startButton.evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset
    };
  });

  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(parseFloat(focusStyle.outlineOffset)).toBeGreaterThanOrEqual(3);
});

test('controle desabilitado comunica visualmente que não está acionável', async ({ page }) => {
  await page.goto('/');

  const pauseButton = page.getByRole('button', { name: 'Pausar' });
  await expect(pauseButton).toBeDisabled();

  const disabledStyle = await pauseButton.evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      opacity: parseFloat(style.opacity),
      cursor: style.cursor
    };
  });

  expect(disabledStyle.opacity).toBeLessThanOrEqual(0.5);
  expect(disabledStyle.cursor).toBe('not-allowed');
});

test('controles mantêm alvo de toque confortável em telas móveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  for (const name of ['Iniciar', 'Pausar']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('canvas cabe melhor na altura de celulares em modo paisagem', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');

  const canvasBox = await page.locator('#game').boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox.height).toBeLessThanOrEqual(390 * 0.63);
  expect(canvasBox.width / canvasBox.height).toBeCloseTo(800 / 520, 1);
});

test('HUD permanece contido em telas móveis estreitas', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 800 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const metrics = await page.locator('.hud').evaluate((hud) => {
      const bounds = hud.getBoundingClientRect();
      const children = [...hud.children].map((child) => child.getBoundingClientRect());

      return {
        scrollWidth: hud.scrollWidth,
        clientWidth: hud.clientWidth,
        childrenContained: children.every(
          (child) => child.left >= bounds.left && child.right <= bounds.right
        )
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.childrenContained).toBe(true);
  }
});

