import { BitmapText } from 'pixi.js';
import { OverlayType } from '../managers/OverlayManager';
import { VoiceType } from '../managers/SoundManager';
import { API_URL, API_VERSION, CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class GameOverOverlay extends Overlay {
  deadSprite;
  titleText;

  constructor(game) {
    super(game);

    this.createContainer();
    this.createOverlay();
  }

  createContainer() {
    // Create text
    this.titleText = new BitmapText('Game Over', this.TITLE_FONT);
    this.container.addChild(this.titleText);
    this.titleText.x = Math.round(this.game.app.screen.width / 2 - this.titleText.width / 2);
    this.titleText.y = 0;

    // Create sprite
    this.deadSprite = this.game.player.deadSprite;
    this.container.addChild(this.deadSprite);
    this.deadSprite.x = Math.round(this.game.app.screen.width / 2 - this.deadSprite.width / 2);
    this.deadSprite.y = 40;

    // Align container
    this.container.y = 15;
  }

  createOverlay() {
    this.overlayElement = document
      .querySelector('#gameover-template')
      .content.cloneNode(true).firstElementChild;

    // Submit button
    this.overlayElement.querySelector('#leaderboard-button').addEventListener('click', async () => {
      await this.game.overlayManager.close(false);
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async beforeOpen() {
    this.busy = true;

    this.overlayElement.querySelector('#score').textContent = `$${this.game.score}`;
    this.overlayElement
      .querySelectorAll('h2')
      .forEach((element) => (element.style.display = 'none'));
    this.game.player.lastRankId = null;

    return true;
  }

  async afterOpen() {
    try {
      this.game.soundManager.playVoice(VoiceType.SCENE_GAME_OVER);

      if (this.game.score > 0) {
        const ranking = await this.postScore(this.game.player.name, this.game.score);
        this.game.player.lastRankId = ranking.id;

        this.overlayElement
          .querySelectorAll('h2')
          .forEach((element) => (element.style.display = 'inherit'));
        this.overlayElement.querySelector('#rank-global').textContent = `#${ranking.globalRank}`;
        this.overlayElement.querySelector(
          '#rank-personal'
        ).textContent = `#${ranking.personalRank}`;
      }
    } catch (error) {
      console.error(error);
      this.error = true;
    }

    this.busy = false;
  }

  afterClose() {
    return OverlayType.LEADERBOARD;
  }

  async postScore(name, score) {
    const url = new URL(`${API_URL}/highscore`);
    url.searchParams.append('version', API_VERSION);

    const response = await fetch(url.href, {
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
