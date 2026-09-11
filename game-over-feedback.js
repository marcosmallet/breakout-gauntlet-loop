(() => {
  const canvas = document.getElementById('game');
  const status = document.getElementById('gameStatus');
  let triggerCount = 0;

  function syncGameOverFeedback() {
    const isGameOver = status.textContent.trim().startsWith('Fim de jogo.');
    const wasGameOver = canvas.classList.contains('game-over-feedback');

    canvas.classList.toggle('game-over-feedback', isGameOver);
    if (isGameOver && !wasGameOver) {
      triggerCount += 1;
      const state = window.__GAME_DEBUG__?.getState?.();
      if (state) {
        status.textContent = `Fim de jogo. ${state.score} pontos • Rodada ${state.round}.`;
      }
    }
  }

  new MutationObserver(syncGameOverFeedback).observe(status, {
    childList: true,
    characterData: true,
    subtree: true
  });

  syncGameOverFeedback();

  window.__GAME_OVER_FEEDBACK_DEBUG__ = {
    getTriggerCount: () => triggerCount
  };
})();
