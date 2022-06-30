import { BitmapText } from 'pixi.js';
import { CONTAINER, DEBUG } from '../Utilities';
import Overlay from './Overlay';

export default class SettingsOverlay extends Overlay {
  FADE_IN_STEPS = 0;
  FADE_OUT_STEPS = 0;

  changedDifficulty = false;

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

    // Difficulty
    this.overlayElement.querySelectorAll('input[name="difficulty-radio"]').forEach((input) => {
      input.addEventListener('change', async (event) => {
        this.game.difficulty = event.target.value;
        localStorage.setItem('DIFFICULTY', event.target.value);

        this.changedDifficulty = true;
        this.overlayElement.querySelector('#continue-button').textContent = 'Restart';
      });
    });

    // Volume
    this.overlayElement.querySelector('#music-range').addEventListener('input', async (event) => {
      this.game.bgMusic.volume = event.target.value;
      localStorage.setItem('MUSIC_VOLUME', event.target.value);
    });
    this.overlayElement
      .querySelector('#effects-range')
      .addEventListener('change', async (event) => {
        this.game.boostSound.volume = event.target.value;
        this.game.coinSound.volume = event.target.value;
        this.game.jumpSound.volume = event.target.value;
        this.game.powerupSound.volume = event.target.value;
        this.game.powerupSound.play();
        localStorage.setItem('EFFECTS_VOLUME', event.target.value);
      });

    // Continue button
    this.overlayElement.querySelector('#continue-button').addEventListener('click', async () => {
      await this.hide();
      this.game.player.dead = false;
      if (this.changedDifficulty) {
        this.game.reset();
      }
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async show() {
    this.overlayElement.querySelectorAll('input[name="difficulty-radio"]')[
      this.game.difficulty
    ].checked = true;
    this.overlayElement.querySelector('#music-range').value = this.game.bgMusic.volume;
    this.overlayElement.querySelector('#effects-range').value = this.game.powerupSound.volume;
    await super.show();
  }
}
