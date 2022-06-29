import { BitmapText } from 'pixi.js';
import { CONTAINER, DEBUG } from '../Utilities';
import Overlay from './Overlay';

export default class SettingsOverlay extends Overlay {
  FADE_IN_STEPS = 0;
  FADE_OUT_STEPS = 0;

  titleText;

  constructor(game) {
    super(game);

    this.createContainer();
    this.createOverlay();
  }

  createContainer() {
    this.titleText = new BitmapText('Settings', this.TITLE_FONT);
    this.container.addChild(this.titleText);
    this.titleText.x = Math.round(this.game.app.screen.width / 2 - this.titleText.width / 2);
    this.titleText.y = 0;

    this.container.y = 15;
  }

  createOverlay() {
    this.overlayElement = document
      .querySelector('template#settings-template')
      .content.cloneNode(true).firstElementChild;

    // Continue button
    this.overlayElement.querySelector('#continue-button').addEventListener('click', async () => {});

    CONTAINER.appendChild(this.overlayElement);
  }
}
