import { BitmapText, Container } from "pixi.js";

export default class HUD {
  game;
  container = new Container();

  boostText;
  scoreText;

  constructor(game) {
    this.game = game;

    // Score text
    this.scoreText = new BitmapText('Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.scoreText.x = 2;
    this.container.addChild(this.scoreText);

    // Boost text
    this.boostText = new BitmapText('Boost: ', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.boostText.x = 2;
    this.boostText.y = 10;
    this.container.addChild(this.boostText);
  }

  updateBoost() {
    this.boostText.text = 'Boost: ' + this.game.boosts;
  }

  updateScore() {
    this.scoreText.text = 'Score: ' + this.game.score;
  }

  reset() {
    this.updateBoost();
    this.updateScore();
  }
}
