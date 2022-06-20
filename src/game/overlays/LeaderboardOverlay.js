import { Timer } from 'eventemitter3-timer';
import { BitmapText, Container } from 'pixi.js';

export default class LeaderboardOverlay {
  BRIGHTNESS = 0.15;
  FADE_STEPS = 10;

  game;
  container = new Container();
  fadeTimer;

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
  }

  async show() {
    if (this.showing) {
      return;
    }

    this.showing = true;
    this.skippable = false;
    this.container.alpha = 1;

    // Show HTML overlay overlay with spinner
    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.innerHTML = '';
    htmlOverlay.setAttribute('aria-busy', true);
    htmlOverlay.style.display = 'block';

    this.game.app.stage.addChild(this.container);

    try {
      // Fetch leaderboard
      let data = await this.fetchLeaderboard();

      // Hide spinner
      htmlOverlay.setAttribute('aria-busy', false);

      // Check player rank
      let rank = this.game.score > 0 && data.length < 100 ? data.length : false;
      let counter = 1;
      for (const entry of data) {
        if (this.game.score > entry.score) {
          rank = counter;
          break;
        }
        counter++;
      }

      if (rank !== false) {
        // Create submit form
        this.createRanked(rank, async (event) => {
          // Post score and update data
          const name = new FormData(event.target).get('name');
          data = await this.postScore(name, this.game.score);

          // Remove submit form
          htmlOverlay.removeChild(htmlOverlay.querySelector('#leaderboard-ranked'));

          // Show table
          this.createTable(data, name, this.game.score);
        });
      } else {
        // Show table
        this.createTable(data);
      }
    } catch (error) {
      console.error(error);

      htmlOverlay.setAttribute('aria-busy', false);
      htmlOverlay.innerHTML = `Error: ${error}`;

      this.createRetry();
    } finally {
      this.skippable = true;
    }
  }

  hide() {
    if (!this.showing) {
      return;
    }

    this.showing = false;
    this.skippable = false;

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

  createTable(data, name, score) {
    const tableTemplate = document.querySelector('#leaderboard-table-template');
    const table = tableTemplate.content.cloneNode(true);
    const tbody = table.querySelector('tbody');
    const rowTemplate = document.querySelector('#leaderboard-row-template');

    let counter = 1;
    for (const entry of data) {
      const row = rowTemplate.content.cloneNode(true);
      if (entry.name === name && parseInt(entry.score) === score) {
        row.querySelector('tr').id = 'you';
      }
      const th = row.querySelectorAll('th');
      th[0].textContent = counter;
      const td = row.querySelectorAll('td');
      td[0].textContent = entry.score;
      td[1].textContent = entry.name;
      tbody.appendChild(row);
      counter++;
    }

    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.appendChild(table);

    if (name && score) {
      const youRow = tbody.querySelector('#you');
      tbody.scrollTop = youRow.offsetTop - youRow.offsetHeight;
    }

    this.createRetry();
  }

  createRetry() {
    const retryTemplate = document.querySelector('#leaderboard-retry-template');
    const retry = retryTemplate.content.cloneNode(true);
    retry.querySelector('button').addEventListener('click', () => {
      this.game.reset();
    });

    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.appendChild(retry);
  }

  createRanked(rank, submitHandler) {
    const rankedTemplate = document.querySelector('#leaderboard-ranked-template');
    const ranked = rankedTemplate.content.cloneNode(true);
    ranked.querySelector('#rank').textContent = `#${rank}`;
    ranked.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      return submitHandler(event);
    });

    const htmlOverlay = document.querySelector('#html-overlay');
    htmlOverlay.appendChild(ranked);
  }

  async fetchLeaderboard() {
    const response = await fetch('https://api.super-waka-land.com/highscore/1.0', {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  async postScore(name, score) {
    const response = await fetch('https://api.super-waka-land.com/highscore/1.0', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        score,
      }),
    });
    return response.json();
  }
}
