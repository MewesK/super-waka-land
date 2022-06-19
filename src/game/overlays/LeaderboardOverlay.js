import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container } from 'pixi.js';

export default class LeaderboardOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;
  skipTimer;

  showing = false;
  skippable = false;

  titleText;

  constructor(game) {
    this.game = game;

    this.titleText = new BitmapText('Leaderboard', {
      fontName: 'Stop Bullying',
      fontSize: 36,
      letterSpacing: -1,
    });
    this.container.addChild(this.titleText);
    this.titleText.x = this.game.app.screen.width / 2 - this.titleText.width / 2;
    this.titleText.y = 0;

    this.container.y = 15;
  }

  update() {
    this.fadeTimer?.update(this.game.app.ticker.elapsedMS);
    this.skipTimer?.update(this.game.app.ticker.elapsedMS);
  }

  show() {
    if (this.showing) {
      return;
    }

    this.skippable = false;
    this.skipTimer = new Timer(1000);
    this.skipTimer.on('end', () => {
      this.skippable = true;
    });
    this.skipTimer.start();

    this.showing = true;
    this.container.alpha = 1;

    this.game.app.stage.addChild(this.container);

    const loadingTemplate = document.getElementById('leaderboard-loading-template');

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';
    leaderboardElement.setAttribute('aria-busy', true);
    leaderboardElement.style.display = 'block';

    fetch('https://api.super-waka-land.com/highscore/1.0', {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        leaderboardElement.setAttribute('aria-busy', false);
        if ('content' in document.createElement('template')) {
          const tableTemplate = document.getElementById('leaderboard-table-template');
          const table = tableTemplate.content.cloneNode(true);
          const tbody = table.querySelector('tbody');

          const rowTemplate = document.getElementById('leaderboard-row-template');
          let counter = 1;
          for (const entry of data) {
            const row = rowTemplate.content.cloneNode(true);
            const th = row.querySelectorAll('th');
            th[0].textContent = counter++;
            const td = row.querySelectorAll('td');
            td[0].textContent = entry.score;
            td[1].textContent = entry.name;
            tbody.appendChild(row);
          }

          leaderboardElement.innerHTML = '';
          leaderboardElement.appendChild(table);
        } else {
          console.error('HTML templates not supported');
        }
      });
  }

  hide() {
    if (!this.showing) {
      return;
    }

    this.showing = false;

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'none';

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
}
