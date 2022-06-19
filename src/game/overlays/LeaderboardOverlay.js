import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container, filters, Rectangle, Sprite } from 'pixi.js';

export default class LeaderboardOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;
  skipTimer;

  showing = false;
  skippable = false;

  titleText;
  scoreText;
  retryText;

  constructor(game) {
    this.game = game;

    this.titleText = new BitmapText('Leaderboard', {
      fontName: 'Stop Bullying',
      fontSize: 36,
      letterSpacing: -1,
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 0;

    this.scoreText = new BitmapText('Rats College Fund:\n$0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(this.scoreText);
    this.scoreText.x = this.game.app.screen.width / 2 - this.scoreText.width / 2;
    this.scoreText.y = 100;

    this.retryText = new BitmapText('Try again', {
      fontName: 'Edit Undo',
      fontSize: 10,
    });
    this.container.addChild(this.retryText);
    this.retryText.x = this.game.app.screen.width / 2 - this.retryText.width / 2;
    this.retryText.y = 150;

    this.container.y = this.game.app.screen.height / 2 - this.container.height / 2 + 15;
  }

  update() {
    this.fadeTimer?.update(this.game.app.ticker.elapsedMS);
    this.skipTimer?.update(this.game.app.ticker.elapsedMS);
  }

  show() {
    if (this.showing) {
      return;
    }

    this.skippable = false;
    this.skipTimer = new Timer(1000);
    this.skipTimer.on('end', () => {
      this.skippable = true;
    });
    this.skipTimer.start();

    this.showing = true;
    this.container.alpha = 1;
    this.scoreText.text = 'Rats College Fund:\n$' + this.game.score;

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
      this.game.container.filters = null;
      this.fadeTimer = null;
    });
    this.fadeTimer.start();
  }
}
