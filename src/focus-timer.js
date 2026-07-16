(function () {
  class FocusTimer {
    constructor({ animator, panel, onComplete, onNearlyComplete }) {
      this.animator = animator;
      this.panel = panel;
      this.onComplete = onComplete;
      this.onNearlyComplete = onNearlyComplete;
      this.interval = null;
      this.endsAt = 0;
      this.minutes = 25;
      this.active = false;
      this.nearlyCompleteNotified = false;
    }

    start(minutes) {
      this.cancel({ silent: true });
      this.minutes = minutes;
      this.endsAt = Date.now() + minutes * 60 * 1000;
      this.active = true;
      this.nearlyCompleteNotified = false;
      this.animator.play('running');
      this.update();
      this.interval = setInterval(() => this.update(), 1000);
    }

    cancel(options = {}) {
      clearInterval(this.interval);
      this.interval = null;
      const wasActive = this.active;
      this.active = false;
      this.nearlyCompleteNotified = false;
      this.panel.setFocusStatus('No active focus timer');
      if (wasActive && !options.silent) this.animator.play('idle', { speak: false });
    }

    update() {
      const remaining = Math.max(0, this.endsAt - Date.now());
      const minutes = Math.floor(remaining / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1000);
      this.panel.setFocusStatus(`Focus: ${minutes}:${String(seconds).padStart(2, '0')}`);

      if (remaining > 0 && remaining <= 60_000 && !this.nearlyCompleteNotified) {
        this.nearlyCompleteNotified = true;
        this.onNearlyComplete?.();
      }

      if (remaining > 0) return;
      this.cancel({ silent: true });
      this.onComplete?.(this.minutes);
    }
  }

  window.NigarKizFocusTimer = { FocusTimer };
})();
