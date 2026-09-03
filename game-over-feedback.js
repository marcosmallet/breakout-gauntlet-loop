(() => {
  const canvas = document.getElementById('game');
  const status = document.getElementById('gameStatus');
  let triggerCount = 0;

  function syncGameOverFeedback() {
    const isGameOver = status.textContent.trim() === 'Fim de jogo.';
    const wasGameOver = canvas.classList.contains('game-over-feedback');

    canvas.classList.toggle('game-over-feedback', isGameOver);
    if (isGameOver && !wasGameOver) triggerCount += 1;
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
