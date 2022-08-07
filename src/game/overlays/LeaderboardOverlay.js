import { BitmapText } from 'pixi.js';
import { OverlayType } from '../managers/OverlayManager';
import { API_URL, API_VERSION, CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class LeaderboardOverlay extends Overlay {
  PAGE_SIZE = 100;

  titleText;

  mode = 'personal';
  page = null;
  last = false;
  date = null;

  selectCharacter = false;

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

    this.overlayElement.querySelector('tbody').addEventListener('scroll', (e) => {
      // Check if the bottom is reached
      if (
        !this.busy &&
        !this.last &&
        e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight
      ) {
        this.displayLeaderboard(this.mode, this.page + 1);
      }
    });

    this.overlayElement.querySelector('#personal-button').addEventListener('click', () => {
      this.overlayElement.querySelector('#global-button').classList.remove('active');
      this.overlayElement.querySelector('#personal-button').classList.add('active');
      this.date = Math.floor(Date.now() / 1000);
      this.displayLeaderboard('personal', 0);
    });

    this.overlayElement.querySelector('#global-button').addEventListener('click', () => {
      this.overlayElement.querySelector('#global-button').classList.add('active');
      this.overlayElement.querySelector('#personal-button').classList.remove('active');
      this.date = Math.floor(Date.now() / 1000);
      this.displayLeaderboard('global', 0);
    });

    // Retry button
    this.overlayElement
      .querySelector('#retry-button')
      .addEventListener('click', () => this.game.overlayManager.close());

    // Select character button
    this.overlayElement.querySelector('#select-character-button').addEventListener('click', () => {
      this.selectCharacter = true;
      this.game.overlayManager.close(false);
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async afterOpen() {
    this.date = Math.floor(Date.now() / 1000);
    this.displayLeaderboard('personal', 0);
  }

  afterClose() {
    if (this.selectCharacter) {
      this.game.overlayManager.open(OverlayType.CHARACTER_SELECT, false);
    } else {
      this.game.reset();
    }

    this.selectCharacter = false;
    this.date = null;
    this.game.player.lastRankId = null;

    return null;
  }

  async displayLeaderboard(mode, page = 0) {
    console.debug(`Loading page ${page + 1} of the "${mode}" leaderboard`);

    // Reset last page flag
    if (page === 0) {
      this.last = false;
    }

    // Check last page flag
    if (this.last) {
      console.debug('Already on the last page of leaderboard');
      return;
    }

    // Fetch leaderboard
    let data = await this.fetchLeaderboard(
      mode === 'personal' ? this.game.player.name : null,
      page * this.PAGE_SIZE
    );
    if (!data) {
      return;
    }
    data = data.sort((a, b) => a.rank - b.rank);

    // Update last page flag
    if (data.length < this.PAGE_SIZE) {
      console.debug('Last page of leaderboard reached');
      this.last = true;
      if (data.length === 0) {
        return;
      }
    }

    // Set state
    this.mode = mode;
    this.page = page;

    // Table body
    const tbody = this.overlayElement.querySelector('tbody');
    if (page === 0) {
      tbody.scrollTop = 1; // Firefox has a bug with 0
      tbody.querySelectorAll('tr').forEach((element) => element.remove());
    }

    // Table rows
    const rowTemplate = document.querySelector('#leaderboard-row-template');
    for (const entry of data) {
      const row = rowTemplate.content.cloneNode(true);
      if (this.game.player.lastRankId && entry.id == this.game.player.lastRankId) {
        row.querySelector('tr').className = 'rank';
      }
      const th = row.querySelectorAll('th');
      th[0].textContent = entry.rank;
      const td = row.querySelectorAll('td');
      td[0].textContent = entry.score;
      td[1].textContent = entry.name;
      tbody.append(row);
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
      url.searchParams.append('date', this.game.player.lastRankDate);
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

  get busy() {
    return this.overlayElement?.querySelector('tbody').getAttribute('aria-busy') === 'true';
  }
  set busy(value) {
    if (this.overlayElement) {
      this.overlayElement.querySelector('tbody').setAttribute('aria-busy', value);
    }
  }
}
