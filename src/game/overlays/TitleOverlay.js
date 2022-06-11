import { BitmapText, Container, filters, MSAA_QUALITY, Rectangle } from 'pixi.js';

export default class TitleOverlay {
  game;
  container = new Container();

  titleText;

  constructor(game) {
    this.game = game;

    this.titleText = new BitmapText('Game Over', {
      fontName: 'Stop Bullying',
      fontSize: 36,
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 65;
  }

  show() {
    const filter1 = new filters.ColorMatrixFilter();
    filter1.desaturate();

    const filter2 = new filters.ColorMatrixFilter();
    filter2.brightness(0.5, false);

    this.game.container.filterArea = new Rectangle(
      0,
      0,
      this.game.app.screen.width,
      this.game.app.screen.height
    );

    this.game.container.filters = [filter1, filter2];

    this.game.app.stage.addChild(this.container);
  }

  hide() {
    this.game.app.stage.removeChild(this.container);
    this.game.container.filters = null;
  }
}
