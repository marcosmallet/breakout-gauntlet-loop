(() => {
  const roundEl = document.getElementById('round');
  const livesEl = document.getElementById('lives');
  const roundModeEl = document.getElementById('roundMode');
  const eliteChoiceEl = document.getElementById('eliteChoice');
  const standardButton = document.getElementById('standardModeButton');
  const eliteButton = document.getElementById('eliteModeButton');
  const pauseButton = document.getElementById('pauseButton');
  const canvas = document.getElementById('game');
  if (!roundEl || !livesEl || !roundModeEl || !window.GameDifficulty) return;

  const ELITE_START_ROUND = 6;
  const MAX_LIVES = 5;

  let trackedRound = Number.parseInt(roundEl.textContent, 10) || 1;
  let livesAtRoundStart = Number.parseInt(livesEl.textContent, 10) || 3;
  let minimumLivesThisRound = livesAtRoundStart;
  let eliteRoundActive = false;
  let eliteEligible = false;
  let awaitingChoice = false;
  let pausedForChoice = false;

  function renderMode() {
    roundModeEl.textContent = awaitingChoice ? 'Escolher' : (eliteRoundActive ? 'Elite' : 'Normal');
    roundModeEl.dataset.elite = String(eliteRoundActive);
    roundModeEl.dataset.choice = String(awaitingChoice);
    if (canvas) canvas.dataset.eliteRound = String(eliteRoundActive);
  }

  function renderChoice() {
    if (!eliteChoiceEl) return;
    eliteChoiceEl.hidden = !awaitingChoice;
  }

  function setEliteRound(active) {
    eliteRoundActive = Boolean(active);
    window.GameDifficulty.setEliteRoundActive(eliteRoundActive);
    renderMode();
  }

  function pauseTransitionForChoice() {
    if (!pauseButton || pauseButton.disabled || pauseButton.getAttribute('aria-pressed') === 'true') return;
    pauseButton.click();
    pausedForChoice = pauseButton.getAttribute('aria-pressed') === 'true';
    if (pausedForChoice) pauseButton.disabled = true;
  }

  function resumeTransitionAfterChoice() {
    if (!pauseButton || !pausedForChoice) return;
    pauseButton.disabled = false;
    pauseButton.click();
    pausedForChoice = false;
  }

  function closeChoice() {
    awaitingChoice = false;
    eliteEligible = false;
    renderChoice();
    renderMode();
  }

  function chooseMode(mode) {
    if (!awaitingChoice) return false;
    const elite = mode === 'elite';
    closeChoice();
    setEliteRound(elite);
    resumeTransitionAfterChoice();
    return true;
  }

  function openChoice() {
    eliteEligible = true;
    awaitingChoice = true;
    setEliteRound(false);
    renderChoice();
    renderMode();
    pauseTransitionForChoice();
    standardButton?.focus();
  }

  function resetTracking(round, lives) {
    trackedRound = round;
    livesAtRoundStart = lives;
    minimumLivesThisRound = lives;
    eliteEligible = false;
    awaitingChoice = false;
    pausedForChoice = false;
    setEliteRound(false);
    renderChoice();
  }

  new MutationObserver(() => {
    const lives = Number.parseInt(livesEl.textContent, 10);
    if (!Number.isInteger(lives)) return;
    minimumLivesThisRound = Math.min(minimumLivesThisRound, lives);
  }).observe(livesEl, { childList: true, characterData: true, subtree: true });

  new MutationObserver(() => {
    const nextRound = Number.parseInt(roundEl.textContent, 10);
    const currentLives = Number.parseInt(livesEl.textContent, 10);
    if (!Number.isInteger(nextRound) || !Number.isInteger(currentLives)) return;

    if (nextRound <= trackedRound) {
      if (nextRound < trackedRound || nextRound === 1) resetTracking(nextRound, currentLives);
      return;
    }

    const sustainedMastery = livesAtRoundStart >= MAX_LIVES && minimumLivesThisRound >= MAX_LIVES;
    const unlocked = nextRound >= ELITE_START_ROUND && sustainedMastery;

    if (unlocked) openChoice();
    else {
      eliteEligible = false;
      awaitingChoice = false;
      setEliteRound(false);
      renderChoice();
    }

    trackedRound = nextRound;
    livesAtRoundStart = currentLives;
    minimumLivesThisRound = currentLives;
  }).observe(roundEl, { childList: true, characterData: true, subtree: true });

  standardButton?.addEventListener('click', () => chooseMode('standard'));
  eliteButton?.addEventListener('click', () => chooseMode('elite'));

  setEliteRound(false);
  renderChoice();

  window.EliteRound = Object.freeze({
    isAwaitingChoice: () => awaitingChoice,
    chooseStandard: () => chooseMode('standard'),
    chooseElite: () => chooseMode('elite')
  });

  window.__ELITE_ROUND_DEBUG__ = {
    getState() {
      return {
        active: eliteRoundActive,
        eligible: eliteEligible,
        awaitingChoice,
        pausedForChoice,
        trackedRound,
        livesAtRoundStart,
        minimumLivesThisRound,
        startRound: ELITE_START_ROUND
      };
    }
  };
})();
