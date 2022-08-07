import { BitmapText, filters, Sprite } from 'pixi.js';
import { VoiceType } from '../managers/SoundManager';
import { CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class CharacterOverlay extends Overlay {
  DEFAULT_NAME = localStorage.getItem('NAME') || '';
  CHARACTERS = [
    [
      {
        text: new BitmapText('Rat', this.DEFAULT_FONT),
        sprite: Sprite.from('rat_idle'),
        color: '#0000ff',
      },
      {
        text: new BitmapText('Burglar', this.DEFAULT_FONT),
        sprite: Sprite.from('burglar_idle'),
        color: '#0000ff',
      },
    ],
    [
      {
        text: new BitmapText('Orange', this.DEFAULT_FONT),
        sprite: Sprite.from('orange_idle'),
        color: '#00ff00',
      },
    ],
    [
      {
        text: new BitmapText('Raccoon', this.DEFAULT_FONT),
        sprite: Sprite.from('racoon_idle'),
        color: '#ff0000',
      },
    ],
    [
      {
        text: new BitmapText('Tutel', this.DEFAULT_FONT),
        sprite: Sprite.from('tutel_idle'),
        color: '#ffff00',
      },
    ],
  ];

  characterIndex;
  skinIndex;

  titleText;
  infoText;

  constructor(game) {
    super(game);

    this.skinIndex = this.CHARACTERS.map(() => 0);

    this.createContainer();
    this.createOverlay();
    this.select(0, 0);
  }

  createContainer() {
    // Register characters
    this.CHARACTERS.forEach((skins, characterIndex) => {
      skins.forEach((skin) => {
        skin.sprite.x = Math.round(
          this.game.app.screen.width / 2 -
            skin.sprite.width / 2 +
            (this.CHARACTERS.length / -2 + characterIndex + 0.5) * (skin.sprite.width + 40)
        );
        skin.sprite.y = 80;
        skin.sprite.interactive = true;
        skin.sprite.on('pointerdown', (event) => {
          event.stopPropagation();
          this.select(characterIndex, null);
        });

        skin.text.x = Math.round(skin.sprite.x + skin.sprite.width / 2) - skin.text.width / 2;
        skin.text.y = 120;

        this.container.addChild(skin.sprite);
        this.container.addChild(skin.text);
      });
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
    this.game.soundManager.playVoice(VoiceType.SCENE_CHARACTER);
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
    this.game.reset();
    return null;
  }

  addEventListeners() {
    super.addEventListeners();
    this.game.inputManager.on({
      name: 'select',
      keys: ['ArrowLeft', 'ArrowRight', 'a', 'd'],
      onDown: (event) =>
        this.select(
          this.characterIndex + (event.key === 'ArrowRight' || event.key === 'd' ? 1 : -1),
          null
        ),
    });
    this.game.inputManager.on({
      name: 'select',
      keys: ['ArrowUp', 'ArrowDown', 'w', 's'],
      onDown: (event) =>
        this.select(
          null,
          this.skinIndex[this.characterIndex] +
            (event.key === 'ArrowUp' || event.key === 'w' ? 1 : -1)
        ),
    });
  }

  removeEventListeners() {
    super.removeEventListeners();
    this.game.inputManager.off('select');
  }

  select(characterIndex, skinIndex) {
    if (characterIndex !== null) {
      this.characterIndex = characterIndex;
      if (this.characterIndex >= this.CHARACTERS.length) {
        this.characterIndex = 0;
      }
      if (this.characterIndex < 0) {
        this.characterIndex = this.CHARACTERS.length - 1;
      }
    }

    if (skinIndex !== null) {
      this.skinIndex[this.characterIndex] = skinIndex;
      if (this.skinIndex[this.characterIndex] >= this.CHARACTERS[this.characterIndex].length) {
        this.skinIndex[this.characterIndex] = 0;
      }
      if (this.skinIndex[this.characterIndex] < 0) {
        this.skinIndex[this.characterIndex] = this.CHARACTERS[this.characterIndex].length - 1;
      }
    }

    console.debug('Selecting ', this.characterIndex, this.skinIndex[this.characterIndex]);

    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);
    this.CHARACTERS.forEach((skins, characterIndex) => {
      skins.forEach((skin, skinIndex) => {
        if (
          characterIndex !== this.characterIndex ||
          skinIndex !== this.skinIndex[this.characterIndex]
        ) {
          skin.sprite.filters = [filter];
          if (characterIndex === this.characterIndex) {
            skin.sprite.alpha = 0;
            skin.text.alpha = 0;
          }
        } else {
          skin.sprite.filters = null;
          skin.sprite.alpha = 1;
          skin.text.alpha = 1;
        }
      });
    });

    this.game.player.skin(this.characterIndex, this.skinIndex[this.characterIndex]);

    // Play voice
    if (this.opened && this.visible) {
      switch (this.characterIndex) {
        case 0:
          this.game.soundManager.playVoice(VoiceType.SELECT_RAT);
          break;
        case 1:
          this.game.soundManager.playVoice(VoiceType.SELECT_ORANGE);
          break;
        case 2:
          this.game.soundManager.playVoice(VoiceType.SELECT_RACCOON);
          break;
        case 3:
          this.game.soundManager.playVoice(VoiceType.SELECT_TUTEL);
          break;
      }
    }
  }
}
