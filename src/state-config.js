const atlas = {
  columns: 8,
  rows: 11,
  cellWidth: 192,
  cellHeight: 208
};

const orderedStateNames = [
  'idle',
  'running-right',
  'running-left',
  'waving',
  'jumping',
  'failed',
  'waiting',
  'running',
  'review'
];

const states = {
  idle: { row: 0, frames: 6, fps: 4, loop: true },
  'running-right': { row: 1, frames: 8, fps: 10, loop: true },
  'running-left': { row: 2, frames: 8, fps: 10, loop: true },
  waving: { row: 3, frames: 4, fps: 7, loop: false, holdMs: 120, message: 'Hi.' },
  jumping: { row: 4, frames: 5, fps: 9, loop: false, holdMs: 120 },
  failed: { row: 5, frames: 8, fps: 7, loop: false, holdMs: 900, message: 'Let us try another way.' },
  waiting: { row: 6, frames: 6, fps: 4, loop: true, message: 'Waiting for your next step.' },
  running: { row: 7, frames: 6, fps: 8, loop: true, message: 'Focus mode.' },
  review: { row: 8, frames: 6, fps: 5, loop: false, holdMs: 1800, message: 'Ready for review.' }
};

const lookDirections = [
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

lookDirections.forEach((direction, index) => {
  const row = index < 8 ? 9 : 10;
  const frame = index % 8;
  states[`look-${direction}`] = {
    row,
    frame,
    frames: 1,
    fps: 1,
    loop: false,
    direction
  };
});

const api = {
  atlas,
  lookDirections,
  orderedStateNames,
  states
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.NigarKizStateConfig = api;
}
