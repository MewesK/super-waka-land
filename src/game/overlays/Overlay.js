import { Timer } from 'eventemitter3-timer';
import { Container, filters } from 'pixi.js';

export default class Overlay {
  TITLE_FONT = {
    fontName: 'Stop Bullying',
    fontSize: 32,
    letterSpacing: -1,
    align: 'center',
  };
  DEFAULT_FONT = {
    fontName: 'Edit Undo',
    fontSize: 14,
    align: 'center',
  };
  INFO_FONT = {
    fontName: 'Edit Undo',
    fontSize: 14,
    align: 'center',
    tint: 0xa0a0a0,
  };

  BRIGHTNESS = 0.15;
  FADE_IN_STEPS = 10;
  FADE_OUT_STEPS = 10;
  SKIP_TIME = 500;

  game;
  container;

  opened = false;
  visible = false;
  skippable = false;

  fadeTimer;
  skipTimer;

  overlayElement;

  constructor(game, container = new Container()) {
    this.game = game;
    this.container = container;
  }

  update() {
    if (this.fadeTimer) {
      this.fadeTimer.update(this.game?.app.ticker.elapsedMS);
    }
    if (this.skipTimer) {
      this.skipTimer.update(this.game?.app.ticker.elapsedMS);
    }
  }

  async open(fade = true) {
    if (this.opened) {
      return false;
    }

    this.opened = true;
    this.visible = true;
    this.skippable = false;

    // Register event listeners
    this.addEventListeners();

    // Add container to parent
    this.game.app.stage.addChild(this.container);

    // Add filter to parent
    const filter = new filters.ColorMatrixFilter();
    this.game.container.filters = [filter];

    // Show overlay
    this.hidden = false;

    // Skippable
    if (this.SKIP_TIME > 0) {
      // Create skip timer
      this.skipTimer = new Timer(this.SKIP_TIME);
      this.skipTimer.on('end', () => {
        this.skipTimer = null;
        this.skippable = true;
      });
      this.skipTimer.start();
    } else {
      this.skippable = true;
    }

    // Fade-In
    if (fade && this.FADE_IN_STEPS > 0) {
      await new Promise((resolve) => {
        // Create fade timer
        this.fadeTimer = new Timer(20);
        this.fadeTimer.repeat = this.FADE_IN_STEPS;
        this.fadeTimer.on('repeat', (elapsedTime, repeat) => {
          // Fade out character overlay
          this.container.alpha = (1 / this.FADE_IN_STEPS) * repeat;
          filter.brightness(1 - ((1 - this.BRIGHTNESS) / this.FADE_OUT_STEPS) * repeat, false);
        });
        this.fadeTimer.on('end', () => {
          this.fadeTimer = null;
          resolve();
        });
        this.fadeTimer.start();
      });
    }

    filter.brightness(this.BRIGHTNESS);
    this.container.alpha = 1;

    return true;
  }

  async close(fade = true) {
    if (!this.opened || !this.skippable || !this.visible) {
      return false;
    }

    // Unregister event listeners
    this.removeEventListeners();

    // Hide overlay
    this.hidden = true;

    // Fade-Out
    if (fade && this.FADE_OUT_STEPS > 0) {
      // Create fade timer
      await new Promise((resolve) => {
        this.fadeTimer = new Timer(20);
        this.fadeTimer.repeat = this.FADE_OUT_STEPS;
        this.fadeTimer.on('repeat', (elapsedTime, repeat) => {
          // Fade out character overlay
          this.container.alpha = 1 - (1 / this.FADE_OUT_STEPS) * repeat;
          this.game.container.filters[0].brightness(
            this.BRIGHTNESS + repeat * ((1 - this.BRIGHTNESS) / this.FADE_OUT_STEPS),
            false
          );
        });
        this.fadeTimer.on('end', () => {
          this.fadeTimer = null;
          resolve();
        });
        this.fadeTimer.start();
      });
    }

    this.game.container.filters[0].brightness(1, false);
    this.container.alpha = 0;
    this.game.app.stage.removeChild(this.container);

    this.opened = false;
    this.visible = false;

    return true;
  }

  afterOpen() {
    // NOP
  }
  beforeOpen() {
    // NOP
    return true;
  }
  afterClose() {
    // NOP
  }
  beforeClose() {
    // NOP
    return true;
  }

  show() {
    if (!this.opened || this.visible) {
      return false;
    }

    this.visible = true;

    // Enable filter
    this.game.container.filters[0].brightness(this.BRIGHTNESS);

    // Show container
    this.container.alpha = 1;

    // Show overlay
    this.hidden = false;

    return true;
  }

  hide() {
    if (!this.opened || !this.visible || !this.skippable) {
      return false;
    }

    this.visible = false;

    // Disable filter
    this.game.container.filters[0].brightness(1);

    // Hide container
    this.container.alpha = 0;

    // Hide overlay
    this.hidden = true;

    return true;
  }

  addEventListeners() {
    this.game.inputManager.on({
      name: 'skip',
      keys: ['s', ' ', 'Enter'],
      onDown: () => this.game.overlayManager.close(),
    });
  }

  removeEventListeners() {
    this.game.inputManager.off('skip');
  }

  get busy() {
    return this.overlayElement?.getAttribute('aria-busy') === 'true';
  }
  set busy(value) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-busy', value);
    }
  }

  get error() {
    return this.overlayElement?.getAttribute('aria-error') === 'true';
  }
  set error(value) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-error', value);
    }
  }

  get hidden() {
    return this.overlayElement?.getAttribute('aria-hidden') === 'true';
  }
  set hidden(value) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-hidden', value);
    }
  }
}
