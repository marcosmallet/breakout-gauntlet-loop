(() => {
  const pauseButton = document.getElementById('pauseButton');
  if (!pauseButton) return;

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || !pauseButton.disabled) return;
    if (document.activeElement?.tagName === 'BUTTON') return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
