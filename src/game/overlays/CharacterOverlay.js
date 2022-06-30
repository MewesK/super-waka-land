import { BitmapText, filters, Sprite } from 'pixi.js';
import { CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class CharacterOverlay extends Overlay {
  FADE_IN_STEPS = 0;

  characters;
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
    // Create rat sprite
    const ratSprite = Sprite.from('rat_idle');
    this.container.addChild(ratSprite);
    ratSprite.x = Math.round(this.game.app.screen.width / 2 - ratSprite.width / 2 - 40);
    ratSprite.y = 80;
    ratSprite.interactive = true;
    ratSprite.on('pointerdown', (event) => {
      event.stopPropagation();
      this.select(0);
    });

    const ratName = new BitmapText('Rat', this.DEFAULT_FONT);
    this.container.addChild(ratName);
    ratName.x = Math.round(this.game.app.screen.width / 2 - ratName.width / 2 - 40);
    ratName.y = 120;

    // Create orange sprite
    const orangeSprite = Sprite.from('orange_idle');
    this.container.addChild(orangeSprite);
    orangeSprite.x = Math.round(this.game.app.screen.width / 2 - ratSprite.width / 2 + 40);
    orangeSprite.y = 86;
    orangeSprite.interactive = true;
    orangeSprite.on('pointerdown', (event) => {
      event.stopPropagation();
      this.select(1);
    });

    const orangeName = new BitmapText('Orange', this.DEFAULT_FONT);
    this.container.addChild(orangeName);
    orangeName.x = Math.round(this.game.app.screen.width / 2 - orangeName.width / 2 + 40);
    orangeName.y = 120;

    this.characters = [
      {
        text: ratName,
        sprite: ratSprite,
        color: '#0000ff',
      },
      {
        text: orangeName,
        sprite: orangeSprite,
        color: '#00ff00',
      },
    ];

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
    this.overlayElement.querySelector('#name-input').addEventListener('input', (event) => {
      console.log(event.target.value);
      event.target.setAttribute(
        'aria-invalid',
        event.target.value?.length < 3 || event.target.value?.length > 32
      );
    });

    // Confirm button
    this.overlayElement.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.game.player.name = new FormData(event.target).get('name');
      this.hide();
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async hide() {
    if (!this.game.player.name) {
      this.overlayElement.querySelector('#confirm-button').click();
      return;
    }

    await super.hide();

    this.game.paused = false;
    this.game.reset();
  }

  select(index) {
    this.selected = index;
    if (this.selected >= this.characters.length) {
      this.selected = 0;
    }

    console.debug('Selecting ', this.selected);

    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);
    this.characters.forEach((character, index) => {
      if (index !== this.selected) {
        character.sprite.filters = [filter];
      } else {
        character.sprite.filters = null;
      }
    });

    this.game.player.character = this.selected;
    this.game.background.character = this.selected;
  }
}
