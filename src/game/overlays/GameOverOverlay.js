import { BitmapText } from 'pixi.js';
import { API_URL, API_VERSION, CONTAINER } from '../Utilities';
import Overlay from './Overlay';

export default class GameOverOverlay extends Overlay {
  FADE_IN_STEPS = 0;
  FADE_OUT_STEPS = 0;

  deadSprite;
  titleText;

  constructor(game) {
    super(game);

    this.createContainer();
    this.createOverlay();
  }

  createContainer() {
    this.titleText = new BitmapText('Game Over', this.TITLE_FONT);
    this.container.addChild(this.titleText);
    this.titleText.x = Math.round(this.game.app.screen.width / 2 - this.titleText.width / 2);
    this.titleText.y = 0;

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
      await this.hide();
      this.game.leaderboardOverlay.show();
    });

    CONTAINER.appendChild(this.overlayElement);
  }

  async show() {
    if (this.showing) {
      return;
    }

    super.show();
    this.isBusy(true);

    try {
      const ranking = await this.postScore(this.game.player.name, this.game.score);
      this.overlayElement.querySelector('#score').textContent = `$${this.game.score}`;
      this.overlayElement.querySelector('#rank').textContent = `#${ranking.rank}`;
      this.game.player.lastRanking = ranking;
    } catch (error) {
      console.error(error);
      this.isError(true);
    }

    this.isBusy(false);
  }

  async postScore(name, score) {
    const response = await fetch(`${API_URL}/highscore/${API_VERSION}`, {
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
