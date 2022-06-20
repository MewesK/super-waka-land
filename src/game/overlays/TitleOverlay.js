import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container, filters, Rectangle, Sprite } from 'pixi.js';

export default class TitleOverlay {
  BRIGHTNESS = 0.15;

  game;
  container = new Container();

  showing = false;

  logoSprite;
  subtitleText;
  tutorialText;

  constructor(game) {
    this.game = game;

    this.logoSprite = Sprite.from('logo');
    this.container.addChild(this.logoSprite);
    this.logoSprite.x = this.game.app.screen.width / 2 - this.logoSprite.width / 2;
    this.logoSprite.y = 0;

    this.subtitleText = new BitmapText('Help rat to start his\ncollege fund!', {
      fontName: 'Edit Undo',
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(this.subtitleText);
    this.subtitleText.x = this.game.app.screen.width / 2 - this.subtitleText.width / 2;
    this.subtitleText.y = 80;

    this.tutorialText = new BitmapText(
      'Tap to jump\nSwipe up for boost\nCollect stuff\nCoin $10 * Coke $50 * Boost $50',
      {
        fontName: 'Edit Undo',
        fontSize: 10,
        align: 'center',
        tint: 0xa0a0a0,
      }
    );
    this.container.addChild(this.tutorialText);
    this.tutorialText.x = this.game.app.screen.width / 2 - this.tutorialText.width / 2;
    this.tutorialText.y = 150;

    this.container.y = this.game.app.screen.height / 2 - this.container.height / 2;
  }

  update() {
  }

  show() {
    if (this.showing) {
      return;
    }

    this.showing = true;
    this.container.alpha = 1;
    this.game.hud.container.alpha = 0;

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
