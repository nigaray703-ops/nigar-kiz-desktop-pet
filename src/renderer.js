const pet = document.getElementById('pet');
const speech = document.getElementById('speech');
const settingsPanelElement = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const settingsToggle = document.getElementById('settings-toggle');
const resetPositionButton = document.getElementById('reset-position');
const focusButtons = [...document.querySelectorAll('.focus-button')];
const cancelFocusButton = document.getElementById('cancel-focus');
const focusStatus = document.getElementById('focus-status');

const { states } = window.NigarKizStateConfig;
const { defaultSettings, normalizeSettings } = window.NigarKizSettingsSchema;
const {
  clickWaveDelayMs,
  getNaturalDurationMs
} = window.NigarKizAnimationBehavior;
const { getLookStateForPointer } = window.NigarKizLookDirection;
const {
  canPlayPriority,
  getActionPlan,
  getIdleAction,
  getShortcutAction,
  priorities
} = window.NigarKizInteraction;
const { PetAnimator } = window.NigarKizPetAnimator;
const { SettingsPanel } = window.NigarKizSettingsPanel;
const { FocusTimer } = window.NigarKizFocusTimer;

let settings = normalizeSettings(defaultSettings);
let isDragging = false;
let lastPointer = null;
let moved = false;
let randomTimer = null;
let pendingClickTimer = null;
let lookTimer = null;
let sequenceTimer = null;
let priorityTimer = null;
let activePriority = priorities.idle;
let lastActivityAt = Date.now();
let wasIdle = false;

const animator = new PetAnimator({ pet, speech });
const panel = new SettingsPanel({
  panel: settingsPanelElement,
  form: settingsForm,
  toggleButton: settingsToggle,
  resetButton: resetPositionButton,
  focusButtons,
  cancelFocusButton,
  focusStatus,
  onChange: updateSettings,
  onResetPosition: resetPosition,
  onStartFocus: startFocus,
  onCancelFocus: cancelFocus
});
const focusTimer = new FocusTimer({
  animator,
  panel,
  onNearlyComplete: () => animator.say('Almost there. Stay with it.'),
  onComplete: (minutes) => {
    clearPriority(priorities.focus);
    window.desktopPet.notifyFocusComplete(minutes);
    runAction('celebrate');
  }
});

const idlePhrases = [
  'One small step is enough.',
  'Time to stretch?',
  'Your project is taking shape.',
  'I am here when you are ready.',
  'A quiet minute can help.'
];

function restState() {
  return focusTimer.active ? 'running' : 'idle';
}

function setActivity() {
  lastActivityAt = Date.now();
}

function setPriority(priority, durationMs = 0) {
  clearTimeout(priorityTimer);
  priorityTimer = null;
  activePriority = priority;
  if (durationMs > 0) {
    priorityTimer = setTimeout(() => clearPriority(priority), durationMs);
  }
}

function clearPriority(priority) {
  if (activePriority !== priority) return;
  activePriority = priorities.idle;
  clearTimeout(priorityTimer);
  priorityTimer = null;
}

function clearSequence() {
  clearTimeout(sequenceTimer);
  sequenceTimer = null;
}

function clearLook() {
  clearTimeout(lookTimer);
  lookTimer = null;
  clearPriority(priorities.mouseLook);
  if (animator.currentState.startsWith('look-')) {
    animator.play(restState(), { speak: false });
  }
}

function sequenceDelayFor(stateName) {
  const state = states[stateName];
  return Math.max(650, Math.min(1800, getNaturalDurationMs(state) + 120));
}

function playSequence(sequenceStates, message) {
  clearSequence();
  if (message) animator.say(message, 2800);

  let index = 0;
  const playNext = () => {
    const stateName = sequenceStates[index];
    const isLast = index === sequenceStates.length - 1;
    animator.play(stateName, {
      returnTo: restState(),
      force: true,
      speak: !message
    });
    index += 1;
    if (!isLast) {
      sequenceTimer = setTimeout(playNext, sequenceDelayFor(stateName));
    }
  };

  playNext();
}

function runAction(action, options = {}) {
  const plan = getActionPlan(action);
  if (!plan) return false;

  const priority = options.priority ?? priorities.manual;
  if (!canPlayPriority({ currentPriority: activePriority, nextPriority: priority })) {
    return false;
  }

  if (options.countAsActivity !== false) setActivity();
  clearLook();
  clearSequence();
  setPriority(priority, options.priorityDurationMs ?? (priority === priorities.manual ? 3400 : 0));

  if (plan.type === 'sequence') {
    playSequence(plan.states, plan.message);
    return true;
  }

  if (plan.message) animator.say(plan.message);
  animator.play(plan.state, {
    returnTo: restState(),
    force: options.force,
    speak: !plan.message
  });
  return true;
}

function applySettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  animator.applySettings(settings);
  panel.setSettings(settings);
  scheduleRandomActions();
}

async function updateSettings(patch) {
  try {
    const saved = await window.desktopPet.updateSettings(patch);
    applySettings(saved);
  } catch (error) {
    console.error(error);
    animator.say('Settings could not be saved.');
  }
}

async function resetPosition() {
  try {
    const saved = await window.desktopPet.resetPosition();
    applySettings(saved);
  } catch (error) {
    console.error(error);
    animator.say('Could not reset position.');
  }
}

function startFocus(minutes) {
  setActivity();
  clearLook();
  clearSequence();
  updateSettings({ focusMinutes: minutes });
  setPriority(priorities.focus);
  focusTimer.start(minutes);
}

function cancelFocus() {
  setActivity();
  focusTimer.cancel();
  clearPriority(priorities.focus);
}

function playTemporary(state) {
  clearLook();
  clearSequence();
  animator.play(state, { returnTo: restState() });
}

function cancelPendingClick() {
  clearTimeout(pendingClickTimer);
  pendingClickTimer = null;
}

function scheduleClickWave() {
  cancelPendingClick();
  pendingClickTimer = setTimeout(() => {
    pendingClickTimer = null;
    runAction('waving');
  }, clickWaveDelayMs);
}

function randomIdleEvent() {
  const elapsedMs = Date.now() - lastActivityAt;
  const action = getIdleAction(elapsedMs);
  if (action === 'idle-phrase') {
    animator.say(idlePhrases[Math.floor(Math.random() * idlePhrases.length)]);
  } else {
    runAction(action, {
      priority: priorities.idle,
      countAsActivity: false,
      priorityDurationMs: 0
    });
  }
  scheduleRandomActions();
}

function scheduleRandomActions() {
  clearTimeout(randomTimer);
  if (!settings.randomActions) return;

  const delay = 45_000 + Math.random() * 75_000;
  randomTimer = setTimeout(() => {
    const canIdleAct =
      !isDragging &&
      !focusTimer.active &&
      activePriority <= priorities.idle &&
      ['idle', 'waiting'].includes(animator.currentState);

    if (canIdleAct) randomIdleEvent();
    else scheduleRandomActions();
  }, delay);
}

function handlePointerDown(event) {
  if (event.button !== 0) return;
  setActivity();
  cancelPendingClick();
  clearLook();
  setPriority(priorities.dragging);
  isDragging = true;
  moved = false;
  lastPointer = { x: event.screenX, y: event.screenY };
  pet.setPointerCapture(event.pointerId);
}

function handlePointerLook(event) {
  if (
    isDragging ||
    focusTimer.active ||
    !settingsPanelElement.hidden ||
    !canPlayPriority({ currentPriority: activePriority, nextPriority: priorities.mouseLook })
  ) {
    return;
  }

  clearTimeout(lookTimer);
  const rect = pet.getBoundingClientRect();
  const state = getLookStateForPointer({
    pointerX: event.clientX,
    pointerY: event.clientY,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2
  });

  if (!state) {
    clearLook();
    return;
  }

  setPriority(priorities.mouseLook);
  animator.play(state, { returnTo: restState(), speak: false });
  lookTimer = setTimeout(() => clearLook(), 900);
}

function handlePointerMove(event) {
  if (!isDragging || !lastPointer) {
    handlePointerLook(event);
    return;
  }

  const dx = event.screenX - lastPointer.x;
  const dy = event.screenY - lastPointer.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  if (dx !== 0 || dy !== 0) {
    window.desktopPet.moveWindow({ x: dx, y: dy });
    if (Math.abs(dx) > 1) {
      animator.play(dx > 0 ? 'running-right' : 'running-left', { speak: false });
    }
    lastPointer = { x: event.screenX, y: event.screenY };
  }
}

function handlePointerUp(event) {
  isDragging = false;
  lastPointer = null;
  clearPriority(priorities.dragging);
  try {
    pet.releasePointerCapture(event.pointerId);
  } catch {}

  if (moved) animator.play(restState(), { speak: false });
  else scheduleClickWave();
}

function isKeyboardFormTarget(target) {
  const tag = String(target?.tagName || '').toUpperCase();
  return target?.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag);
}

function handleKeyDown(event) {
  if (event.key === 'Escape' && !settingsPanelElement.hidden) {
    event.preventDefault();
    panel.hide();
    return;
  }

  const shortcutAction = getShortcutAction(event);
  if (shortcutAction) {
    event.preventDefault();
    if (shortcutAction === 'close-settings') {
      panel.hide();
    } else if (shortcutAction === 'focus') {
      startFocus(settings.focusMinutes);
    } else {
      runAction(shortcutAction);
    }
    return;
  }

  if (isKeyboardFormTarget(event.target)) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    runAction('waving');
  }
  if (event.key === ' ') {
    event.preventDefault();
    runAction('jumping');
  }
  if (event.key === 'ContextMenu') {
    event.preventDefault();
    setActivity();
    window.desktopPet.showContextMenu();
  }
}

function handleSystemIdleChanged(isIdle) {
  if (focusTimer.active) return;
  if (isIdle) {
    wasIdle = true;
    runAction('rest', {
      priority: priorities.idle,
      countAsActivity: false,
      priorityDurationMs: 0
    });
    return;
  }
  if (wasIdle) {
    wasIdle = false;
    runAction('waving');
  }
}

async function init() {
  try {
    applySettings(await window.desktopPet.getSettings());
  } catch (error) {
    console.error(error);
    applySettings(defaultSettings);
  }

  pet.addEventListener('pointerdown', handlePointerDown);
  pet.addEventListener('pointermove', handlePointerMove);
  pet.addEventListener('pointerenter', handlePointerLook);
  pet.addEventListener('pointerleave', clearLook);
  pet.addEventListener('pointerup', handlePointerUp);
  pet.addEventListener('keydown', handleKeyDown);
  pet.addEventListener('dblclick', () => {
    cancelPendingClick();
    runAction('jumping');
  });
  pet.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    setActivity();
    window.desktopPet.showContextMenu();
  });

  window.desktopPet.onAction((action) => runAction(action));
  window.desktopPet.onSettingsChanged(applySettings);
  window.desktopPet.onToggleSettings(() => {
    clearLook();
    panel.toggle();
  });
  window.desktopPet.onFocusStart(startFocus);
  window.desktopPet.onFocusCancel(cancelFocus);
  window.desktopPet.onSystemIdleChanged(handleSystemIdleChanged);

  window.addEventListener('error', (event) => {
    console.error(event.error || event.message);
    playTemporary('failed');
  });

  animator.play('idle', { speak: false });
  setTimeout(() => animator.say('Nigar Kiz is ready.'), 700);
}

init();
