import { BitmapText, Sprite } from 'pixi.js';
import Overlay from './Overlay';

export default class TitleOverlay extends Overlay {
  FADE_IN_STEPS = 0;
  FADE_OUT_STEPS = 0;

  logoSprite;
  subtitleText;
  infoText;

  constructor(game) {
    super(game);

    this.createContainer();
  }

  createContainer() {
    // Create logo
    this.logoSprite = Sprite.from('logo');
    this.container.addChild(this.logoSprite);
    this.logoSprite.x = Math.round(this.game.app.screen.width / 2 - this.logoSprite.width / 2);
    this.logoSprite.y = 0;

    // Create text
    this.subtitleText = new BitmapText('Help rat to start his\ncollege fund!', this.DEFAULT_FONT);
    this.container.addChild(this.subtitleText);
    this.subtitleText.x = Math.round(this.game.app.screen.width / 2 - this.subtitleText.width / 2);
    this.subtitleText.y = 80;

    this.infoText = new BitmapText('Click to start', this.INFO_FONT);
    this.container.addChild(this.infoText);
    this.infoText.x = Math.round(this.game.app.screen.width / 2 - this.infoText.width / 2);
    this.infoText.y = 172;

    // Align container
    this.container.y = Math.round(this.game.app.screen.height / 2 - this.container.height / 2);
  }
}
