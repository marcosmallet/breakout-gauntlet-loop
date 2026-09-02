(() => {
  const canvas = document.getElementById('game');
  const livesEl = document.getElementById('lives');
  if (!canvas || !livesEl) return;

  const style = document.createElement('style');
  style.textContent = `
    #game[data-last-life="true"] {
      animation: last-life-pulse 1.1s ease-in-out infinite;
    }

    @keyframes last-life-pulse {
      0%, 100% { box-shadow: 0 0 0 1px hsl(var(--round-accent-hue, 205) 80% 58% / 0.42), 0 0 28px hsl(var(--round-accent-hue, 205) 80% 58% / 0.2); }
      50% { box-shadow: 0 0 0 2px rgb(248 113 113 / 0.95), 0 0 42px rgb(239 68 68 / 0.52); }
    }

    @media (prefers-reduced-motion: reduce) {
      #game[data-last-life="true"] {
        animation: none;
        box-shadow: 0 0 0 2px rgb(248 113 113 / 0.95), 0 0 32px rgb(239 68 68 / 0.42);
      }
    }
  `;
  document.head.appendChild(style);

  const sync = () => {
    const state = window.__GAME_DEBUG__?.getState?.();
    const isLastLife = state?.running && state.lives === 1;
    if (isLastLife) canvas.dataset.lastLife = 'true';
    else delete canvas.dataset.lastLife;
  };

  new MutationObserver(sync).observe(livesEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  document.getElementById('startButton')?.addEventListener('click', () => requestAnimationFrame(sync));
  sync();

  window.__LAST_LIFE_FEEDBACK_DEBUG__ = { sync };
})();
