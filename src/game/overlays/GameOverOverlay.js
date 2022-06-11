import { BitmapText, Container, filters, Rectangle, Sprite } from 'pixi.js';

export default class GameOverOverlay {
  game;
  container = new Container();

  deadSprite;
  titleText;
  scoreText;
  retryText;

  constructor(game) {
    this.game = game;

    this.deadSprite = Sprite.from('dead');
    this.container.addChild(this.deadSprite);
    this.deadSprite.x = this.game.app.screen.width / 2 - this.deadSprite.width / 2;
    this.deadSprite.y = 0;

    this.titleText = new BitmapText('Game Over', {
      fontName: 'Stop Bullying',
      fontSize: 36,
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 65;

    this.scoreText = new BitmapText('Final Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 18,
    });
    this.container.addChild(this.scoreText);
    this.scoreText.x = this.game.app.screen.width / 2 - this.scoreText.width / 2;
    this.scoreText.y = 100;

    this.retryText = new BitmapText('Try again', {
      fontName: 'Edit Undo',
      fontSize: 12,
    });
    this.container.addChild(this.retryText);
    this.retryText.x = this.game.app.screen.width / 2 - this.retryText.width / 2;
    this.retryText.y = 150;

    this.container.y = this.game.app.screen.height / 2 - this.container.height / 2 + 15;
  }

  show() {
    this.game.map.itemEffects.forEach((itemEffect) => itemEffect.destroy());

    const filter1 = new filters.ColorMatrixFilter();
    filter1.desaturate();

    const filter2 = new filters.ColorMatrixFilter();
    filter2.brightness(0.5, false);

    this.game.container.filterArea = new Rectangle(
      0,
      0,
      this.game.container.width,
      this.game.container.height
    );

    this.game.container.filters = [filter1, filter2];

    this.scoreText.text = 'Final Score: ' + this.game.score;
    this.scoreText.x = this.game.app.screen.width / 2 - this.scoreText.width / 2;

    this.game.app.stage.addChild(this.container);
  }

  hide() {
    this.game.app.stage.removeChild(this.container);
    this.game.container.filters = null;
  }
}
