import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container, filters, Sprite } from 'pixi.js';

export default class CharacterOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;

  characters;
  selected;
  showing = false;

  titleText;
  subtitleText;

  constructor(game) {
    this.game = game;

    const ratSprite = Sprite.from('rat_idle');
    this.container.addChild(ratSprite);
    ratSprite.x = this.game.app.screen.width / 2 - ratSprite.width / 2 - 40;
    ratSprite.y = 60;

    const ratName = new BitmapText('Rat', {
      fontName: 'Edit Undo',
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(ratName);
    ratName.x = this.game.app.screen.width / 2 - ratName.width / 2 - 40;
    ratName.y = 100;

    const orangeSprite = Sprite.from('orange_idle');
    this.container.addChild(orangeSprite);
    orangeSprite.x = this.game.app.screen.width / 2 - ratSprite.width / 2 + 40;
    orangeSprite.y = 66;

    const orangeName = new BitmapText('Orange', {
      fontName: 'Edit Undo',
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(orangeName);
    orangeName.x = this.game.app.screen.width / 2 - orangeName.width / 2 + 40;
    orangeName.y = 100;

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

    this.titleText = new BitmapText('Characters', {
      fontName: 'Stop Bullying',
      fontSize: 36,
      letterSpacing: -1,
      align: 'center',
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 0;

    this.subtitleText = new BitmapText('Please select a character', {
      fontName: 'Edit Undo',
      fontSize: 10,
      align: 'center',
      tint: 0xa0a0a0,
    });
    this.container.addChild(this.subtitleText);
    this.subtitleText.x = this.game.app.screen.width / 2 - this.subtitleText.width / 2;
    this.subtitleText.y = 160;

    this.container.y = 15;

    this.select(0);
  }

  update() {
    this.fadeTimer?.update(this.game.app.ticker.elapsedMS);
  }

  async show() {
    if (this.showing) {
      return;
    }

    this.showing = true;
    this.container.alpha = 1;

    // Show HTML overlay overlay with spinner
    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.innerHTML = '';
    htmlOverlay.style.display = 'block';

    this.createSelect();

    this.game.app.stage.addChild(this.container);
  }

  hide() {
    if (!this.showing) {
      return;
    }

    this.showing = false;

    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.innerHTML = '';
    htmlOverlay.style.display = 'none';

    this.fadeTimer = new Timer(20);
    this.fadeTimer.repeat = this.FADE_STEPS;
    this.fadeTimer.on('repeat', (elapsedTime, repeat) => {
      this.container.alpha = Math.max(0, 1 - (1 / (this.FADE_STEPS - 2)) * repeat);
      this.game.hud.container.alpha = Math.max(1, (1 / (this.FADE_STEPS - 2)) * repeat);
      this.game.container.filters[0].brightness(
        this.BRIGHTNESS + repeat * ((1 - this.BRIGHTNESS) / this.FADE_STEPS),
        false
      );
    });
    this.fadeTimer.on('end', () => {
      this.game.app.stage.removeChild(this.container);
      this.game.hud.container.alpha = 1;
      this.game.container.filters = null;
      this.fadeTimer = null;
    });
    this.fadeTimer.start();
  }

  createSelect() {
    const selectTemplate = document.querySelector('#character-select-template');
    const select = selectTemplate.content.cloneNode(true);
    select.querySelector('button').addEventListener('click', () => {
      this.game.paused = false;
      this.game.reset();
    });

    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.appendChild(select);
  }

  select(index) {
    this.selected = index;
    if (this.selected >= this.characters.length) {
      this.selected = 0;
    }

    const filter = new filters.ColorMatrixFilter();
    filter.brightness(this.BRIGHTNESS);
    this.characters.forEach((character, index) => {
      if (index !== this.selected) {
        character.sprite.filters = [filter];
      } else {
        character.sprite.filters = null;
      }
    });
  }
}
