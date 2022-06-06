import { Container, filters } from 'pixi.js';

export default class TitleOverlay {
  game;
  container = new Container();

  constructor(game) {
    this.game = game;
  }

  show() {
    const filter1 = new filters.BlurFilter();

    this.game.container.filterArea = new Rectangle(
      0,
      0,
      this.game.container.width,
      this.game.container.height
    );

    this.game.container.filters = [filter1];

    this.game.app.stage.addChild(this.container);
  }

  hide() {
    this.game.app.stage.removeChild(this.container);
    this.game.container.filters = null;
  }
}
