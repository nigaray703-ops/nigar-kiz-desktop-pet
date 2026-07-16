const assert = require('node:assert/strict');
const test = require('node:test');

const {
  defaultSettings,
  focusDurations,
  normalizeSettings,
  scaleOptions,
  validatePosition
} = require('../src/settings-schema');

test('normalizeSettings returns defaults for missing values', () => {
  assert.deepEqual(normalizeSettings(), defaultSettings);
});

test('normalizeSettings accepts valid user preferences', () => {
  const normalized = normalizeSettings({
    scale: 'large',
    alwaysOnTop: false,
    randomActions: false,
    speechBubble: false,
    launchAtLogin: true,
    focusMinutes: 45,
    windowPosition: { x: 120, y: 240 }
  });

  assert.equal(normalized.scale, 'large');
  assert.equal(normalized.alwaysOnTop, false);
  assert.equal(normalized.randomActions, false);
  assert.equal(normalized.speechBubble, false);
  assert.equal(normalized.launchAtLogin, true);
  assert.equal(normalized.focusMinutes, 45);
  assert.deepEqual(normalized.windowPosition, { x: 120, y: 240 });
});

test('normalizeSettings rejects invalid values safely', () => {
  const normalized = normalizeSettings({
    scale: 'huge',
    alwaysOnTop: 'yes',
    randomActions: 1,
    speechBubble: null,
    launchAtLogin: 'true',
    focusMinutes: 30,
    windowPosition: { x: 'left', y: Number.POSITIVE_INFINITY }
  });

  assert.equal(normalized.scale, defaultSettings.scale);
  assert.equal(normalized.alwaysOnTop, defaultSettings.alwaysOnTop);
  assert.equal(normalized.randomActions, defaultSettings.randomActions);
  assert.equal(normalized.speechBubble, defaultSettings.speechBubble);
  assert.equal(normalized.launchAtLogin, defaultSettings.launchAtLogin);
  assert.equal(normalized.focusMinutes, defaultSettings.focusMinutes);
  assert.equal(normalized.windowPosition, null);
});

test('validatePosition clamps numeric coordinates to a work area', () => {
  assert.deepEqual(
    validatePosition(
      { x: -100, y: 9999 },
      { x: 10, y: 20, width: 500, height: 400 },
      { width: 120, height: 160 }
    ),
    { x: 10, y: 260 }
  );
});

test('settings constants expose only supported UI choices', () => {
  assert.deepEqual(scaleOptions, ['small', 'medium', 'large']);
  assert.deepEqual(focusDurations, [25, 45, 60]);
});
