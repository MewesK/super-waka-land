import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container, filters, Rectangle, Sprite } from 'pixi.js';

export default class GameOverOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;
  skipTimer;

  showing = false;
  skippable = false;

  deadSprite;
  titleText;
  scoreText;

  constructor(game) {
    this.game = game;

    this.titleText = new BitmapText('Game Over', {
      fontName: 'Stop Bullying',
      fontSize: 36,
      letterSpacing: -1,
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 0;

    this.deadSprite = Sprite.from('rat_dead');
    this.container.addChild(this.deadSprite);
    this.deadSprite.x = this.game.app.screen.width / 2 - this.deadSprite.width / 2;
    this.deadSprite.y = 50;

    this.scoreText = new BitmapText('Rats College Fund:\n$0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(this.scoreText);
    this.scoreText.x = this.game.app.screen.width / 2 - this.scoreText.width / 2;
    this.scoreText.y = 130;

    this.container.y = this.game.app.screen.height / 2 - this.container.height / 2;
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
    this.skipTimer = new Timer(500);
    this.skipTimer.on('end', () => {
      this.skippable = true;
    });
    this.skipTimer.start();

    this.showing = true;
    this.container.alpha = 1;
    this.scoreText.text = 'Rats College Fund:\n$' + this.game.score;

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

    this.game.app.stage.removeChild(this.container);
  }
}
