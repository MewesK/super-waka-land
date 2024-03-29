import { BitmapText } from 'pixi.js';
import { OverlayType } from '../managers/OverlayManager';
import { EffectType, VoiceType } from '../managers/SoundManager';
import { CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class SettingsOverlay extends Overlay {
  changedDifficulty = false;
  previousOverlay = null;

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
      this.game.soundManager.setMusicVolume(event.target.value);
      localStorage.setItem('MUSIC_VOLUME', event.target.value);
    });
    this.overlayElement.querySelector('#effect-range').addEventListener('change', async (event) => {
      this.game.soundManager.setEffectVolume(event.target.value);
      this.game.soundManager.playEffect(EffectType.POWER_UP);
      localStorage.setItem('EFFECT_VOLUME', event.target.value);
    });
    this.overlayElement.querySelector('#voice-range').addEventListener('change', async (event) => {
      this.game.soundManager.setVoiceVolume(event.target.value);
      this.game.soundManager.playVoice(VoiceType.WAO);
      localStorage.setItem('VOICE_VOLUME', event.target.value);
    });

    // Continue button
    this.overlayElement
      .querySelector('#continue-button')
      .addEventListener('click', () => this.game.overlayManager.close());

    CONTAINER.appendChild(this.overlayElement);
  }

  beforeOpen() {
    // Pause
    this.game.paused = true;

    // Set form values
    this.overlayElement.querySelectorAll('input[name="difficulty-radio"]')[
      this.game.difficulty
    ].checked = true;
    this.overlayElement.querySelector('#music-range').value =
      this.game.soundManager.getMusicVolume();
    this.overlayElement.querySelector('#effect-range').value =
      this.game.soundManager.getEffectVolume();
    this.overlayElement.querySelector('#voice-range').value =
      this.game.soundManager.getVoiceVolume();

    return true;
  }

  afterClose() {
    // Reset game with new difficulty (only during game)
    if (this.changedDifficulty) {
      this.changedDifficulty = false;
      this.game.reset();
    }

    // Unpause
    this.game.paused = false;
    return null;
  }
}
