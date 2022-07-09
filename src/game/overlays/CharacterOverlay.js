import { BitmapText, filters, Sprite } from 'pixi.js';
import { VoiceType } from '../managers/SoundManager';
import { CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class CharacterOverlay extends Overlay {
  DEFAULT_NAME = localStorage.getItem('NAME') || '';
  CHARACTERS = [
    {
      text: new BitmapText('Rat', this.DEFAULT_FONT),
      sprite: Sprite.from('rat_idle'),
      color: '#0000ff',
    },
    {
      text: new BitmapText('Orange', this.DEFAULT_FONT),
      sprite: Sprite.from('orange_idle'),
      color: '#00ff00',
    },
    {
      text: new BitmapText('Raccoon', this.DEFAULT_FONT),
      sprite: Sprite.from('racoon_idle'),
      color: '#ff0000',
    },
    {
      text: new BitmapText('Tutel', this.DEFAULT_FONT),
      sprite: Sprite.from('tutel_idle'),
      color: '#ffff00',
    },
  ];

  selected;

  titleText;
  infoText;

  constructor(game) {
    super(game);

    this.createContainer();
    this.createOverlay();
    this.select(0);
  }

  createContainer() {
    // Register characters
    this.CHARACTERS.forEach((character, index) => {
      this.container.addChild(character.sprite);
      character.sprite.x = Math.round(
        this.game.app.screen.width / 2 -
          character.sprite.width / 2 +
          (this.CHARACTERS.length / -2 + index + 0.5) * (character.sprite.width + 40)
      );
      character.sprite.y = 80;
      character.sprite.interactive = true;
      character.sprite.on('pointerdown', (event) => {
        event.stopPropagation();
        this.select(index);
      });

      this.container.addChild(character.text);
      character.text.x =
        Math.round(character.sprite.x + character.sprite.width / 2) - character.text.width / 2;
      character.text.y = 120;
    });

    // Create text
    this.titleText = new BitmapText('Characters', this.TITLE_FONT);
    this.container.addChild(this.titleText);
    this.titleText.x = Math.round(this.game.app.screen.width / 2 - this.titleText.width / 2);
    this.titleText.y = 0;

    this.infoText = new BitmapText('Select a character', this.INFO_FONT);
    this.container.addChild(this.infoText);
    this.infoText.x = Math.round(this.game.app.screen.width / 2 - this.infoText.width / 2);
    this.infoText.y = 45;

    // Align container
    this.container.y = 15;
  }

  createOverlay() {
    this.overlayElement = document
      .querySelector('template#character-template')
      .content.cloneNode(true).firstElementChild;

    // Input validation
    this.overlayElement.querySelector('#name-text').value = this.DEFAULT_NAME;
    this.overlayElement.querySelector('#name-text').addEventListener('input', (event) => {
      event.target.setAttribute(
        'aria-invalid',
        event.target.value?.length < 3 || event.target.value?.length > 32
      );
    });

    // Confirm button
    this.overlayElement.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.game.player.name = new FormData(event.target).get('name');
      localStorage.setItem('NAME', this.game.player.name);
      this.game.overlayManager.close();
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  afterOpen() {
    this.select(0);
  }

  beforeClose(f) {
    // Submit form if necessary
    if (!this.game.player.name) {
      this.overlayElement.querySelector('#confirm-button').click();
      return false;
    }
    return true;
  }

  afterClose() {
    this.game.overlayManager.current = null;
    this.game.reset();
  }

  addEventListeners() {
    super.addEventListeners();
    this.game.inputManager.on({
      name: 'select',
      keys: ['ArrowLeft', 'ArrowRight'],
      onDown: () => this.select(this.selected + 1),
    });
  }

  removeEventListeners() {
    super.removeEventListeners();
    this.game.inputManager.off('select');
  }

  select(index) {
    if (!this.opened || !this.visible) {
      return false;
    }

    this.selected = index;
    if (this.selected >= this.CHARACTERS.length) {
      this.selected = 0;
    }

    console.debug('Selecting ', this.selected);

    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);
    this.CHARACTERS.forEach((character, index) => {
      if (index !== this.selected) {
        character.sprite.filters = [filter];
      } else {
        character.sprite.filters = null;
      }
    });

    this.game.player.character = this.selected;

    // Play voice
    switch (this.selected) {
      case 0:
        this.game.soundManager.playVoice(VoiceType.RAT1);
        break;
      case 1:
        this.game.soundManager.playVoice(VoiceType.ORANGE1);
        break;
    }
  }
}
