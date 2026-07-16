const scaleOptions = ['small', 'medium', 'large'];
const focusDurations = [25, 45, 60];

const scaleConfigs = {
  small: { scale: 0.82, window: { width: 220, height: 270 } },
  medium: { scale: 1, window: { width: 250, height: 310 } },
  large: { scale: 1.22, window: { width: 300, height: 380 } }
};

const defaultSettings = {
  scale: 'medium',
  alwaysOnTop: true,
  randomActions: true,
  speechBubble: true,
  launchAtLogin: false,
  focusMinutes: 25,
  windowPosition: null
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function readBoolean(value, fallback) {
  return isBoolean(value) ? value : fallback;
}

function readScale(value) {
  return scaleOptions.includes(value) ? value : defaultSettings.scale;
}

function readFocusMinutes(value) {
  return focusDurations.includes(value) ? value : defaultSettings.focusMinutes;
}

function readPosition(value) {
  if (!isPlainObject(value)) return null;
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) return null;
  return { x: Math.round(value.x), y: Math.round(value.y) };
}

function normalizeSettings(input = {}) {
  const source = isPlainObject(input) ? input : {};

  return {
    scale: readScale(source.scale),
    alwaysOnTop: readBoolean(source.alwaysOnTop, defaultSettings.alwaysOnTop),
    randomActions: readBoolean(source.randomActions, defaultSettings.randomActions),
    speechBubble: readBoolean(source.speechBubble, defaultSettings.speechBubble),
    launchAtLogin: readBoolean(source.launchAtLogin, defaultSettings.launchAtLogin),
    focusMinutes: readFocusMinutes(source.focusMinutes),
    windowPosition: readPosition(source.windowPosition)
  };
}

function validatePosition(position, workArea, windowSize) {
  const parsed = readPosition(position);
  if (!parsed || !isPlainObject(workArea) || !isPlainObject(windowSize)) return null;

  const minX = Number.isFinite(workArea.x) ? workArea.x : 0;
  const minY = Number.isFinite(workArea.y) ? workArea.y : 0;
  const width = Number.isFinite(workArea.width) ? workArea.width : windowSize.width;
  const height = Number.isFinite(workArea.height) ? workArea.height : windowSize.height;
  const maxX = Math.max(minX, minX + width - windowSize.width);
  const maxY = Math.max(minY, minY + height - windowSize.height);

  return {
    x: Math.min(Math.max(parsed.x, minX), maxX),
    y: Math.min(Math.max(parsed.y, minY), maxY)
  };
}

function getScaleConfig(scale) {
  return scaleConfigs[readScale(scale)];
}

const api = {
  defaultSettings,
  focusDurations,
  getScaleConfig,
  normalizeSettings,
  scaleConfigs,
  scaleOptions,
  validatePosition
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.NigarKizSettingsSchema = api;
}
