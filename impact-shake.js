(() => {
  const scoreEl = document.getElementById('score');
  const canvas = document.getElementById('game');
  if (!scoreEl || !canvas) return;

  let previousScore = Number(scoreEl.textContent) || 0;

  const observer = new MutationObserver(() => {
    const nextScore = Number(scoreEl.textContent) || 0;
    if (nextScore > previousScore) {
      canvas.classList.remove('impact-shake');
      void canvas.offsetWidth;
      canvas.classList.add('impact-shake');
    }
    previousScore = nextScore;
  });

  observer.observe(scoreEl, { childList: true, characterData: true, subtree: true });
  canvas.addEventListener('animationend', () => canvas.classList.remove('impact-shake'));
})();
