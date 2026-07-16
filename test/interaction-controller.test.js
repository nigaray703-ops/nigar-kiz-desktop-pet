const assert = require('node:assert/strict');
const test = require('node:test');

const {
  actionMap,
  canPlayPriority,
  getActionPlan,
  getIdleAction,
  getShortcutAction,
  priorities
} = require('../src/interaction-controller');

test('manual action names map to existing states or approved sequences', () => {
  assert.equal(actionMap.work.state, 'running');
  assert.equal(actionMap.review.state, 'review');
  assert.equal(actionMap.rest.state, 'waiting');
  assert.equal(actionMap.waiting.state, 'waiting');
  assert.deepEqual(actionMap.sleep.states, ['failed', 'waiting']);
  assert.deepEqual(actionMap.celebrate.states, ['jumping', 'waving', 'review']);
});

test('interaction action plans only use approved sprite state names', () => {
  const { states } = require('../src/state-config');
  for (const plan of Object.values(actionMap)) {
    const stateNames = plan.type === 'sequence' ? plan.states : [plan.state];
    for (const stateName of stateNames) {
      assert.ok(states[stateName], `${stateName} must exist in state-config`);
    }
  }
});

test('unknown actions are ignored safely', () => {
  assert.equal(getActionPlan('unknown'), null);
});

test('higher-priority behavior blocks lower-priority behavior', () => {
  assert.equal(
    canPlayPriority({
      currentPriority: priorities.dragging,
      nextPriority: priorities.mouseLook
    }),
    false
  );
  assert.equal(
    canPlayPriority({
      currentPriority: priorities.idle,
      nextPriority: priorities.manual
    }),
    true
  );
});

test('keyboard shortcuts map to actions when focus is not inside a form field', () => {
  assert.equal(getShortcutAction({ key: 'w', target: { tagName: 'DIV' } }), 'waving');
  assert.equal(getShortcutAction({ key: 'J', target: { tagName: 'DIV' } }), 'jumping');
  assert.equal(getShortcutAction({ key: 'f', target: { tagName: 'DIV' } }), 'focus');
  assert.equal(getShortcutAction({ key: 'r', target: { tagName: 'DIV' } }), 'review');
  assert.equal(getShortcutAction({ key: 'Escape', target: { tagName: 'DIV' } }), 'close-settings');
});

test('keyboard shortcuts do not run inside form controls', () => {
  assert.equal(getShortcutAction({ key: 'w', target: { tagName: 'INPUT' } }), null);
  assert.equal(getShortcutAction({ key: 'j', target: { tagName: 'SELECT' } }), null);
  assert.equal(getShortcutAction({ key: 'r', target: { tagName: 'TEXTAREA' } }), null);
  assert.equal(getShortcutAction({ key: 'f', target: { tagName: 'DIV', isContentEditable: true } }), null);
});

test('idle action selection escalates from light idle to rest-like behavior', () => {
  assert.equal(getIdleAction(60_000, 0), 'idle-phrase');
  assert.equal(getIdleAction(60_000, 0.5), 'waving');
  assert.equal(getIdleAction(150_000, 0), 'waiting');
  assert.equal(getIdleAction(360_000, 0), 'sleep');
});
