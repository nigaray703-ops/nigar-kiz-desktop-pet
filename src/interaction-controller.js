const priorities = {
  idle: 0,
  mouseLook: 1,
  manual: 2,
  focus: 3,
  dragging: 4
};

const actionMap = {
  waving: { type: 'state', state: 'waving' },
  jumping: { type: 'state', state: 'jumping' },
  work: { type: 'state', state: 'running', message: 'Working steadily.' },
  review: { type: 'state', state: 'review' },
  rest: { type: 'state', state: 'waiting', message: 'Taking a quiet pause.' },
  waiting: { type: 'state', state: 'waiting', message: 'Taking a quiet pause.' },
  sleep: { type: 'sequence', states: ['failed', 'waiting'], message: 'Resting for a moment.' },
  celebrate: { type: 'sequence', states: ['jumping', 'waving', 'review'], message: 'Focus complete. Nicely done.' }
};

function canPlayPriority({ currentPriority, nextPriority }) {
  return nextPriority >= currentPriority;
}

function getActionPlan(action) {
  return actionMap[action] || null;
}

function isFormTarget(target) {
  const tag = String(target?.tagName || '').toUpperCase();
  return Boolean(
    target?.isContentEditable ||
      ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag)
  );
}

function getShortcutAction(eventLike) {
  if (isFormTarget(eventLike.target)) return null;
  const key = String(eventLike.key || '').toLowerCase();
  if (key === 'w') return 'waving';
  if (key === 'j') return 'jumping';
  if (key === 'f') return 'focus';
  if (key === 'r') return 'review';
  if (key === 'escape') return 'close-settings';
  return null;
}

function getIdleAction(elapsedMs, random = Math.random()) {
  if (elapsedMs >= 300_000) return 'sleep';
  if (elapsedMs >= 120_000) return 'waiting';
  if (random < 0.34) return 'idle-phrase';
  if (random < 0.67) return 'waving';
  return 'jumping';
}

const api = {
  actionMap,
  canPlayPriority,
  getActionPlan,
  getIdleAction,
  getShortcutAction,
  priorities
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.NigarKizInteraction = api;
}
