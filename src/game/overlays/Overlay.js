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

  showing = false;
  skippable = false;

  fadeTimer;
  skipTimer;

  overlayElement;

  constructor(game, container = new Container()) {
    this.game = game;
    this.container = container;
  }

  update() {
    this.fadeTimer?.update(this.game?.app.ticker.elapsedMS);
    this.skipTimer?.update(this.game?.app.ticker.elapsedMS);
  }

  async show() {
    if (this.showing) {
      return;
    }

    this.showing = true;
    this.skippable = false;

    // Add filter to parent
    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);
    this.game.container.filters = [filter];

    // Add container to parent
    this.game.app.stage.addChild(this.container);

    // Show overlay
    this.showOverlayElement();

    // Skippable
    if (this.SKIP_TIME > 0) {
      // Create skip timer
      this.skipTimer = new Timer(500);
      this.skipTimer.on('end', () => {
        this.skippable = true;
      });
      this.skipTimer.start();
    } else {
      this.skippable = true;
    }

    // Fade-In
    if (this.FADE_IN_STEPS > 0) {
      await new Promise((resolve) => {
        // Create fade timer
        this.fadeTimer = new Timer(20);
        this.fadeTimer.repeat = this.FADE_IN_STEPS;
        this.fadeTimer.on('repeat', (elapsedTime, repeat) => {
          // Fade out character overlay
          this.container.alpha = (1 / this.FADE_IN_STEPS) * repeat;
          this.game.container.filters[0].brightness(
            this.BRIGHTNESS + repeat * (this.BRIGHTNESS / this.FADE_IN_STEPS),
            false
          );
        });
        this.fadeTimer.on('end', () => {
          this.fadeTimer = null;
          resolve();
        });
        this.fadeTimer.start();
      });
    } else {
      this.container.alpha = 1;
    }
  }

  async hide() {
    if (!this.showing) {
      return;
    }

    this.showing = false;
    this.hideOverlayElement();

    // Fade-Out
    if (this.FADE_OUT_STEPS > 0) {
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

    this.container.alpha = 0;
    this.game.container.filters = null;
    this.game.app.stage.removeChild(this.container);
  }

  isBusy(value) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-busy', value);
    }
  }

  isError(value) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-error', value);
    }
  }

  showOverlayElement(loading = false) {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-hidden', false);
      this.overlayElement.setAttribute('aria-error', false);
      this.overlayElement.setAttribute('aria-busy', false);
    }
  }

  hideOverlayElement() {
    if (this.overlayElement) {
      this.overlayElement.setAttribute('aria-hidden', true);
      this.overlayElement.setAttribute('aria-error', false);
      this.overlayElement.setAttribute('aria-busy', false);
    }
  }
}
