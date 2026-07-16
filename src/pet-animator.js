(function () {
  const { atlas, states } = window.NigarKizStateConfig;
  const {
    getOneShotReturnDelay,
    shouldPreserveLoopPlayback
  } = window.NigarKizAnimationBehavior;
  const { getScaleConfig } = window.NigarKizSettingsSchema;

  class PetAnimator {
    constructor({ pet, speech }) {
      this.pet = pet;
      this.speech = speech;
      this.currentState = 'idle';
      this.frame = 0;
      this.timer = null;
      this.returnTimer = null;
      this.speechTimer = null;
      this.settings = null;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        this.reducedMotion = event.matches;
        this.play(this.currentState, { speak: false });
      });
    }

    applySettings(settings) {
      this.settings = settings;
      document.documentElement.style.setProperty('--pet-scale', getScaleConfig(settings.scale).scale);
      if (!settings.speechBubble) this.hideSpeech();
    }

    draw() {
      const state = states[this.currentState];
      const frame = state.frame ?? this.frame;
      this.pet.style.backgroundPosition = `${-frame * atlas.cellWidth}px ${-state.row * atlas.cellHeight}px`;
    }

    play(name, options = {}) {
      const state = states[name];
      if (!state) return;

      if (shouldPreserveLoopPlayback({
        currentState: this.currentState,
        nextState: name,
        state,
        hasActiveTimer: Boolean(this.timer),
        force: options.force
      })) {
        this.returnState = options.returnTo || this.returnState || 'idle';
        if (state.message && options.speak !== false) this.say(state.message);
        return;
      }

      clearInterval(this.timer);
      clearTimeout(this.returnTimer);
      this.timer = null;
      this.returnTimer = null;
      this.currentState = name;
      this.frame = 0;
      this.returnState = options.returnTo || 'idle';
      this.draw();

      if (state.message && options.speak !== false) this.say(state.message);
      if (name === 'jumping' && !this.reducedMotion) this.playJumpCss();
      if (this.reducedMotion || state.frames <= 1) {
        this.scheduleReturn(state, { reducedMotion: this.reducedMotion });
        return;
      }

      this.timer = setInterval(() => {
        this.frame += 1;
        if (this.frame >= state.frames) {
          if (state.loop) {
            this.frame = 0;
          } else {
            clearInterval(this.timer);
            this.timer = null;
            this.scheduleReturn(state);
            return;
          }
        }
        this.draw();
      }, 1000 / state.fps);
    }

    scheduleReturn(state, options = {}) {
      const delay = getOneShotReturnDelay(state, options);
      if (delay === null) return;
      const returnState = this.returnState;
      if (delay <= 0) {
        this.play(returnState, { speak: false });
        return;
      }
      this.returnTimer = setTimeout(() => {
        this.returnTimer = null;
        this.play(returnState, { speak: false });
      }, delay);
    }

    playJumpCss() {
      this.pet.classList.remove('is-jumping');
      void this.pet.offsetWidth;
      this.pet.classList.add('is-jumping');
    }

    say(text, duration = 2400) {
      if (!this.settings?.speechBubble) return;
      clearTimeout(this.speechTimer);
      this.speech.textContent = text;
      this.speech.classList.remove('hidden');
      this.speechTimer = setTimeout(() => this.hideSpeech(), duration);
    }

    hideSpeech() {
      clearTimeout(this.speechTimer);
      this.speech.classList.add('hidden');
    }
  }

  window.NigarKizPetAnimator = { PetAnimator };
})();
