import { BitmapText } from 'pixi.js';
import { API_URL, API_VERSION, CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class LeaderboardOverlay extends Overlay {
  PAGE_SIZE = 20;

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

    this.overlayElement
      .querySelector('#personal-button')
      .addEventListener('click', () => {
        this.overlayElement.querySelector('#global-button').classList.remove('active');
        this.overlayElement.querySelector('#personal-button').classList.add('active');
        this.displayLeaderboardByRank(
          this.game.player.name,
          this.game.player.lastPersonalRank || null
        )
      });

    this.overlayElement
      .querySelector('#global-button')
      .addEventListener('click', () => {
        this.overlayElement.querySelector('#global-button').classList.add('active');
        this.overlayElement.querySelector('#personal-button').classList.remove('active');
        this.displayLeaderboardByRank(null, this.game.player.lastGlobalRank || null);
      });

    this.overlayElement
      .querySelector('#retry-button')
      .addEventListener('click', () => this.game.overlayManager.close());

    CONTAINER.appendChild(this.overlayElement);
  }

  async afterOpen() {
    this.displayLeaderboardByRank(this.game.player.name, this.game.player.lastPersonalRank || null);
  }

  afterClose() {
    this.game.overlayManager.current = null;
    this.game.reset();
  }

  async displayLeaderboardByRank(name = null, rank = null) {
    if (rank === null) {
      this.displayLeaderboard(name, 0, null);
    } else {
      const offset = rank - (rank % this.PAGE_SIZE);
      const page = offset / this.PAGE_SIZE;
      this.displayLeaderboard(name, page, rank);
    }
  }

  async displayLeaderboard(name, page = 0, rank = null) {
    const offset = rank ? rank - (rank % this.PAGE_SIZE) : page * this.PAGE_SIZE;
    const data = await this.fetchLeaderboard(name, offset);

    const rowTemplate = document.querySelector('#leaderboard-row-template');
    const tbody = this.overlayElement.querySelector('tbody');
    tbody.querySelectorAll('tr').forEach((element) => element.remove());

    let rankElement = null;
    for (const entry of data) {
      const row = rowTemplate.content.cloneNode(true);
      if (rank && entry.rank === rank) {
        rankElement = row.querySelector('tr');
        rankElement.className = 'rank';
      }
      const th = row.querySelectorAll('th');
      th[0].textContent = entry.rank;
      const td = row.querySelectorAll('td');
      td[0].textContent = entry.score;
      td[1].textContent = entry.name;
      tbody.appendChild(row);
    }
    if (rankElement) {
      tbody.scrollTop = rankElement.offsetTop - rankElement.offsetHeight;
    }
  }

  async fetchLeaderboard(name, offset = 0) {
    this.busy = true;

    let response = null;
    try {
      const url = new URL(`${API_URL}/highscore`);
      if (name) {
        url.searchParams.append('name', name);
      }
      url.searchParams.append('offset', offset);
      url.searchParams.append('version', API_VERSION);

      response = await fetch(url.href, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.error = false;
    } catch (error) {
      console.error(error);
      this.error = true;
    }
    this.busy = false;

    return response?.json();
  }
}
