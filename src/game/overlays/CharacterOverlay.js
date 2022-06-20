import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container } from 'pixi.js';

export default class CharacterOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;

  showing = false;

  titleText;
  subtitleText;

  constructor(game) {
    this.game = game;

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
      fontSize: 16,
      align: 'center',
    });
    this.container.addChild(this.subtitleText);
    this.subtitleText.x = this.game.app.screen.width / 2 - this.subtitleText.width / 2;
    this.subtitleText.y = 150;

    this.container.y = 15;
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
      this.game.container.filters[0].brightness(
        this.BRIGHTNESS + repeat * ((1 - this.BRIGHTNESS) / this.FADE_STEPS),
        false
      );
    });
    this.fadeTimer.on('end', () => {
      this.game.app.stage.removeChild(this.container);
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
}
