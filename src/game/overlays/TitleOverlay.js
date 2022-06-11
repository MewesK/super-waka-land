import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container, filters, Rectangle } from 'pixi.js';

export default class TitleOverlay {
  BRIGHTNESS = 0.6;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;

  showing = false;

  titleText;

  constructor(game) {
    this.game = game;

    this.titleText = new BitmapText('Super\nWaka Land', {
      fontName: 'Stop Bullying',
      fontSize: 36,
      align: 'center',
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 0;

    this.container.y = this.game.app.screen.height / 2 - this.container.height / 2 + 15;
  }

  update() {
    if (this.fadeTimer === null) {
      return;
    }

    this.fadeTimer?.update(this.game.app.ticker.elapsedMS);
  }

  show() {
    if (this.showing) {
      return;
    }

    this.showing = true;

    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);

    this.game.container.filterArea = new Rectangle(
      0,
      0,
      this.game.app.screen.width,
      this.game.app.screen.height
    );

    this.game.container.filters = [filter];

    this.game.app.stage.addChild(this.container);
  }

  hide() {
    if (!this.showing) {
      return;
    }

    this.showing = false;

    this.fadeTimer = new Timer(20);
    this.fadeTimer.repeat = this.FADE_STEPS;
    this.fadeTimer.on('repeat', (elapsedTime, repeat) => {
      this.container.alpha = Math.max(0, 1 - (1 / (this.FADE_STEPS - 2)) * repeat);
      this.game.container.filters[0].brightness(
        this.BRIGHTNESS + repeat * ((1 - this.BRIGHTNESS) / this.FADE_STEPS),
        false
      );
    });
    this.fadeTimer.on('end', () => {
      this.game.app.stage.removeChild(this.container);
      this.container.alpha = 1.0;
      this.game.container.filters = null;
      this.fadeTimer = null;
    });
    this.fadeTimer.start();
  }
}
