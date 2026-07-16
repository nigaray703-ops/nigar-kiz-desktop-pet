const directionNames = [
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
];

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function getNearestLookDirection(dx, dy) {
  const degrees = normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  const index = Math.round(degrees / 22.5) % directionNames.length;
  return directionNames[index];
}

function getLookStateForPointer({ pointerX, pointerY, centerX, centerY, deadzone = 18 }) {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  if (Math.hypot(dx, dy) < deadzone) return null;
  return `look-${getNearestLookDirection(dx, dy)}`;
}

const api = {
  directionNames,
  getLookStateForPointer,
  getNearestLookDirection,
  normalizeDegrees
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.NigarKizLookDirection = api;
}
