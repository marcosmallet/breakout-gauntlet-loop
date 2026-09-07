(() => {
  const powerStatusEl = document.getElementById('powerStatus');
  const gameStatusEl = document.getElementById('gameStatus');
  if (!powerStatusEl || !gameStatusEl) return;

  const timedPowers = [
    {
      label: 'Raquete larga',
      collectedMessage: 'Poder coletado: Raquete larga!',
      expiredMessage: 'Raquete larga terminou.'
    },
    {
      label: 'Bola gigante',
      collectedMessage: 'Poder coletado: Bola gigante!',
      expiredMessage: 'Bola gigante terminou.'
    },
    {
      label: 'Tempo lento',
      collectedMessage: 'Poder coletado: Tempo lento!',
      expiredMessage: 'Tempo lento terminou.'
    }
  ];

  let previousPowerStatus = powerStatusEl.textContent;

  new MutationObserver(() => {
    const nextPowerStatus = powerStatusEl.textContent;

    for (const power of timedPowers) {
      const expired = previousPowerStatus.includes(power.label) && !nextPowerStatus.includes(power.label);
      if (expired && gameStatusEl.textContent === power.collectedMessage) {
        gameStatusEl.textContent = power.expiredMessage;
        break;
      }
    }

    previousPowerStatus = nextPowerStatus;
  }).observe(powerStatusEl, { childList: true, characterData: true, subtree: true });
})();
