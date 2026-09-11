(() => {
  const canvas = document.getElementById('game');
  const status = document.getElementById('gameStatus');
  const score = document.getElementById('score');
  const round = document.getElementById('round');
  let triggerCount = 0;
  let summaryPending = false;

  function syncGameOverFeedback() {
    const statusText = status.textContent.trim();
    const isGameOver = statusText.startsWith('Fim de jogo.');
    const wasGameOver = canvas.classList.contains('game-over-feedback');

    canvas.classList.toggle('game-over-feedback', isGameOver);
    if (!isGameOver || wasGameOver || summaryPending) return;

    triggerCount += 1;
    summaryPending = true;
    queueMicrotask(() => {
      summaryPending = false;
      if (status.textContent.trim() !== 'Fim de jogo.') return;
      status.textContent = `Fim de jogo. ${score.textContent} pontos • Rodada ${round.textContent}.`;
    });
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
