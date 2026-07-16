const assert = require('node:assert/strict');
const test = require('node:test');

const { atlas, states, orderedStateNames } = require('../src/state-config');

test('sprite atlas keeps the v2 8x11 geometry', () => {
  assert.deepEqual(atlas, {
    columns: 8,
    rows: 11,
    cellWidth: 192,
    cellHeight: 208
  });
});

test('standard animation states keep the approved rows and frame counts', () => {
  assert.deepEqual(
    orderedStateNames,
    [
      'idle',
      'running-right',
      'running-left',
      'waving',
      'jumping',
      'failed',
      'waiting',
      'running',
      'review'
    ]
  );

  assert.equal(states.idle.row, 0);
  assert.equal(states.idle.frames, 6);
  assert.equal(states['running-right'].row, 1);
  assert.equal(states['running-right'].frames, 8);
  assert.equal(states['running-left'].row, 2);
  assert.equal(states['running-left'].frames, 8);
  assert.equal(states.waving.row, 3);
  assert.equal(states.waving.frames, 4);
  assert.equal(states.jumping.row, 4);
  assert.equal(states.jumping.frames, 5);
  assert.equal(states.failed.row, 5);
  assert.equal(states.failed.frames, 8);
  assert.equal(states.waiting.row, 6);
  assert.equal(states.waiting.frames, 6);
  assert.equal(states.running.row, 7);
  assert.equal(states.running.frames, 6);
  assert.equal(states.review.row, 8);
  assert.equal(states.review.frames, 6);
});

test('look direction rows keep all 16 v2 direction cells', () => {
  assert.equal(states['look-000'].row, 9);
  assert.equal(states['look-000'].frame, 0);
  assert.equal(states['look-157.5'].row, 9);
  assert.equal(states['look-157.5'].frame, 7);
  assert.equal(states['look-180'].row, 10);
  assert.equal(states['look-180'].frame, 0);
  assert.equal(states['look-337.5'].row, 10);
  assert.equal(states['look-337.5'].frame, 7);
});
