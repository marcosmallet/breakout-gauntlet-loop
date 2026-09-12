(() => {
  const powerStatusEl = document.getElementById('powerStatus');
  const gameStatusEl = document.getElementById('gameStatus');
  if (!powerStatusEl || !gameStatusEl) return;

  const timedPowers = [
    {
      label: 'Raquete larga',
      expiredMessage: 'Raquete larga terminou.'
    },
    {
      label: 'Bola gigante',
      expiredMessage: 'Bola gigante terminou.'
    },
    {
      label: 'Tempo lento',
      expiredMessage: 'Tempo lento terminou.'
    }
  ];

  let previousPowerStatus = powerStatusEl.textContent;

  function lifecycleStatusOwnsMessage(status) {
    return (
      status === 'Pausado.' ||
      status === 'Fim de jogo.' ||
      status.startsWith('Prepare-se') ||
      status.startsWith('Rodada ') ||
      status.startsWith('Próxima ')
    );
  }

  new MutationObserver(() => {
    const nextPowerStatus = powerStatusEl.textContent;

    for (const power of timedPowers) {
      const expired = previousPowerStatus.includes(power.label) && !nextPowerStatus.includes(power.label);
      const currentStatus = gameStatusEl.textContent.trim();
      if (expired && !lifecycleStatusOwnsMessage(currentStatus)) {
        gameStatusEl.textContent = power.expiredMessage;
        break;
      }
    }

    previousPowerStatus = nextPowerStatus;
  }).observe(powerStatusEl, { childList: true, characterData: true, subtree: true });
})();
