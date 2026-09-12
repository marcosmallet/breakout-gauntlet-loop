(() => {
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  if (!startButton || !pauseButton || typeof navigator.getGamepads !== 'function') return;

  const AXIS_DEAD_ZONE = 0.35;
  const BUTTON_PRIMARY = 0;
  const BUTTON_START = 9;
  const BUTTON_DPAD_LEFT = 14;
  const BUTTON_DPAD_RIGHT = 15;

  let leftPressed = false;
  let rightPressed = false;
  let primaryPressed = false;
  let startPressed = false;

  function dispatchDirection(key, pressed) {
    document.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    }));
  }

  function syncDirection(key, nextPressed, previousPressed) {
    if (nextPressed === previousPressed) return previousPressed;
    dispatchDirection(key, nextPressed);
    return nextPressed;
  }

  function buttonPressed(gamepad, index) {
    return gamepad.buttons?.[index]?.pressed === true;
  }

  function activeGamepad() {
    const gamepads = navigator.getGamepads?.() || [];
    return Array.from(gamepads).find((gamepad) => gamepad?.connected) || null;
  }

  function releaseDirections() {
    leftPressed = syncDirection('ArrowLeft', false, leftPressed);
    rightPressed = syncDirection('ArrowRight', false, rightPressed);
    primaryPressed = false;
    startPressed = false;
  }

  function pollGamepad() {
    const gamepad = activeGamepad();

    if (!gamepad) {
      releaseDirections();
      requestAnimationFrame(pollGamepad);
      return;
    }

    const horizontalAxis = Number.isFinite(gamepad.axes?.[0]) ? gamepad.axes[0] : 0;
    const pausedByPlayer = pauseButton.getAttribute('aria-pressed') === 'true';
    const nextLeft = !pausedByPlayer && (
      horizontalAxis < -AXIS_DEAD_ZONE || buttonPressed(gamepad, BUTTON_DPAD_LEFT)
    );
    const nextRight = !pausedByPlayer && (
      horizontalAxis > AXIS_DEAD_ZONE || buttonPressed(gamepad, BUTTON_DPAD_RIGHT)
    );

    leftPressed = syncDirection('ArrowLeft', nextLeft && !nextRight, leftPressed);
    rightPressed = syncDirection('ArrowRight', nextRight && !nextLeft, rightPressed);

    const nextPrimaryPressed = buttonPressed(gamepad, BUTTON_PRIMARY);
    if (nextPrimaryPressed && !primaryPressed && pauseButton.disabled) {
      startButton.click();
    }
    primaryPressed = nextPrimaryPressed;

    const nextStartPressed = buttonPressed(gamepad, BUTTON_START);
    if (nextStartPressed && !startPressed && !pauseButton.disabled) {
      pauseButton.click();
    }
    startPressed = nextStartPressed;

    requestAnimationFrame(pollGamepad);
  }

  window.addEventListener('blur', releaseDirections);
  window.addEventListener('pagehide', releaseDirections);
  window.addEventListener('gamepaddisconnected', releaseDirections);
  requestAnimationFrame(pollGamepad);
})();
