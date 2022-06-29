import { BitmapText } from 'pixi.js';
import { API_URL, API_VERSION, CONTAINER, DEBUG } from '../Utilities';
import Overlay from './Overlay';

export default class LeaderboardOverlay extends Overlay {
  FADE_IN_STEPS = 0;

  titleText;

  constructor(game) {
    super(game);

    this.createContainer();
    this.createOverlay();
  }

  createContainer() {
    this.titleText = new BitmapText('Leaderboard', this.TITLE_FONT);
    this.container.addChild(this.titleText);
    this.titleText.x = Math.round(this.game.app.screen.width / 2 - this.titleText.width / 2);
    this.titleText.y = 0;

    this.container.y = 15;
  }

  createOverlay() {
    this.overlayElement = document
      .querySelector('#leaderboard-template')
      .content.cloneNode(true).firstElementChild;

    this.overlayElement.querySelector('#retry-button').addEventListener('click', async () => {
      await this.hide();
      this.game.reset();
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async show() {
    if (this.showing) {
      return;
    }

    await super.show();
    this.isBusy(true);

    try {
      const data = await this.fetchLeaderboard(this.game.player.lastRanking?.rank);
      const tbody = this.overlayElement.querySelector('tbody');
      const rowTemplate = document.querySelector('#leaderboard-row-template');

      tbody.innerHtml = '';

      for (const entry of data) {
        const row = rowTemplate.content.cloneNode(true);
        if (entry.rank === this.game.player.lastRanking?.rank) {
          row.querySelector('tr').className = 'rank';
        }
        const th = row.querySelectorAll('th');
        th[0].textContent = entry.rank;
        const td = row.querySelectorAll('td');
        td[0].textContent = entry.score;
        td[1].textContent = entry.name;
        tbody.appendChild(row);
      }
    } catch (error) {
      console.error(error);
      this.isError(true);
    }

    this.isBusy(false);
  }

  async fetchLeaderboard() {
    const response = await fetch(`${API_URL}/highscore/${API_VERSION}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }
}
