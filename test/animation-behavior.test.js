const assert = require('node:assert/strict');
const test = require('node:test');

const {
  clickWaveDelayMs,
  getOneShotReturnDelay,
  shouldPreserveLoopPlayback
} = require('../src/animation-behavior');

test('shouldPreserveLoopPlayback keeps an active same-state loop running', () => {
  assert.equal(
    shouldPreserveLoopPlayback({
      currentState: 'running-right',
      nextState: 'running-right',
      state: { loop: true },
      hasActiveTimer: true
    }),
    true
  );
});

test('shouldPreserveLoopPlayback restarts when state or playback mode changes', () => {
  assert.equal(
    shouldPreserveLoopPlayback({
      currentState: 'running-right',
      nextState: 'running-left',
      state: { loop: true },
      hasActiveTimer: true
    }),
    false
  );
  assert.equal(
    shouldPreserveLoopPlayback({
      currentState: 'running-right',
      nextState: 'running-right',
      state: { loop: true },
      hasActiveTimer: true,
      force: true
    }),
    false
  );
});

test('getOneShotReturnDelay keeps review visible longer after animation finishes', () => {
  assert.equal(
    getOneShotReturnDelay({ loop: false, frames: 6, fps: 5, holdMs: 1800 }),
    1800
  );
});

test('getOneShotReturnDelay gives reduced motion one-shot states a natural duration', () => {
  assert.equal(
    getOneShotReturnDelay(
      { loop: false, frames: 6, fps: 5, holdMs: 1800 },
      { reducedMotion: true }
    ),
    3000
  );
});

test('getOneShotReturnDelay leaves one-frame look directions on screen', () => {
  assert.equal(
    getOneShotReturnDelay({ loop: false, frames: 1, fps: 1, direction: '090' }),
    null
  );
});

test('clickWaveDelayMs leaves time for a double-click to become jumping instead', () => {
  assert.ok(clickWaveDelayMs >= 250);
});
