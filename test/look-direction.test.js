const assert = require('node:assert/strict');
const test = require('node:test');

const {
  directionNames,
  getLookStateForPointer,
  getNearestLookDirection,
  normalizeDegrees
} = require('../src/look-direction');

test('directionNames exposes all 16 v2 look directions in order', () => {
  assert.deepEqual(directionNames, [
    '000',
    '022.5',
    '045',
    '067.5',
    '090',
    '112.5',
    '135',
    '157.5',
    '180',
    '202.5',
    '225',
    '247.5',
    '270',
    '292.5',
    '315',
    '337.5'
  ]);
});

test('getNearestLookDirection maps screen vectors to v2 clock directions', () => {
  assert.equal(getNearestLookDirection(0, -100), '000');
  assert.equal(getNearestLookDirection(100, 0), '090');
  assert.equal(getNearestLookDirection(0, 100), '180');
  assert.equal(getNearestLookDirection(-100, 0), '270');
  assert.equal(getNearestLookDirection(100, -100), '045');
  assert.equal(getNearestLookDirection(100, 100), '135');
});

test('getLookStateForPointer returns null inside the calm deadzone', () => {
  assert.equal(
    getLookStateForPointer({
      pointerX: 103,
      pointerY: 101,
      centerX: 100,
      centerY: 100,
      deadzone: 8
    }),
    null
  );
});

test('getLookStateForPointer returns the matching look state outside the deadzone', () => {
  assert.equal(
    getLookStateForPointer({
      pointerX: 140,
      pointerY: 60,
      centerX: 100,
      centerY: 100
    }),
    'look-045'
  );
});

test('normalizeDegrees keeps angles inside a positive circle', () => {
  assert.equal(normalizeDegrees(-22.5), 337.5);
  assert.equal(normalizeDegrees(382.5), 22.5);
});
