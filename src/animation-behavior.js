const clickWaveDelayMs = 275;

function shouldPreserveLoopPlayback({
  currentState,
  nextState,
  state,
  hasActiveTimer,
  force = false
}) {
  return Boolean(
    !force &&
    currentState === nextState &&
    state?.loop &&
    hasActiveTimer
  );
}

function getNaturalDurationMs(state) {
  if (!state || !Number.isFinite(state.frames) || !Number.isFinite(state.fps) || state.fps <= 0) {
    return 0;
  }
  return Math.ceil((state.frames / state.fps) * 1000);
}

function getOneShotReturnDelay(state, options = {}) {
  if (!state || state.loop) return null;
  if (state.direction) return null;
  const holdMs = Number.isFinite(state.holdMs) ? state.holdMs : 0;
  if (options.reducedMotion) return getNaturalDurationMs(state) + holdMs;
  return holdMs;
}

const api = {
  clickWaveDelayMs,
  getNaturalDurationMs,
  getOneShotReturnDelay,
  shouldPreserveLoopPlayback
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.NigarKizAnimationBehavior = api;
}
