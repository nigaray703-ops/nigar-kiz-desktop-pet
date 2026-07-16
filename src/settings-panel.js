(function () {
  const { focusDurations, scaleOptions } = window.NigarKizSettingsSchema;

  class SettingsPanel {
    constructor({ panel, form, toggleButton, resetButton, focusButtons, cancelFocusButton, focusStatus, onChange, onResetPosition, onStartFocus, onCancelFocus }) {
      this.panel = panel;
      this.form = form;
      this.toggleButton = toggleButton;
      this.resetButton = resetButton;
      this.focusButtons = focusButtons;
      this.cancelFocusButton = cancelFocusButton;
      this.focusStatus = focusStatus;
      this.onChange = onChange;
      this.onResetPosition = onResetPosition;
      this.onStartFocus = onStartFocus;
      this.onCancelFocus = onCancelFocus;

      this.wireEvents();
    }

    wireEvents() {
      this.toggleButton.addEventListener('click', () => this.toggle());
      this.form.addEventListener('change', () => this.onChange(this.readForm()));
      this.resetButton.addEventListener('click', () => this.onResetPosition());
      this.cancelFocusButton.addEventListener('click', () => this.onCancelFocus());
      this.focusButtons.forEach((button) => {
        button.addEventListener('click', () => this.onStartFocus(Number(button.dataset.minutes)));
      });
    }

    readForm() {
      const data = new FormData(this.form);
      return {
        scale: data.get('scale'),
        alwaysOnTop: data.has('alwaysOnTop'),
        randomActions: data.has('randomActions'),
        speechBubble: data.has('speechBubble'),
        launchAtLogin: data.has('launchAtLogin'),
        focusMinutes: Number(data.get('focusMinutes'))
      };
    }

    setSettings(settings) {
      this.form.elements.scale.value = scaleOptions.includes(settings.scale) ? settings.scale : 'medium';
      this.form.elements.alwaysOnTop.checked = settings.alwaysOnTop;
      this.form.elements.randomActions.checked = settings.randomActions;
      this.form.elements.speechBubble.checked = settings.speechBubble;
      this.form.elements.launchAtLogin.checked = settings.launchAtLogin;
      this.form.elements.focusMinutes.value = String(focusDurations.includes(settings.focusMinutes) ? settings.focusMinutes : 25);
    }

    setFocusStatus(text) {
      this.focusStatus.textContent = text;
    }

    toggle() {
      if (this.panel.hidden) this.show();
      else this.hide();
    }

    show() {
      this.panel.hidden = false;
      this.toggleButton.setAttribute('aria-expanded', 'true');
      this.form.elements.scale.focus();
    }

    hide() {
      this.panel.hidden = true;
      this.toggleButton.setAttribute('aria-expanded', 'false');
      this.toggleButton.focus();
    }
  }

  window.NigarKizSettingsPanel = { SettingsPanel };
})();
