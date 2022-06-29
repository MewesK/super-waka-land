import { BitmapText, Container } from 'pixi.js';

export default class HUD {
  game;
  container = new Container();

  boostText;
  scoreText;
  nameText;

  constructor(game) {
    this.game = game;

    // Score text
    this.scoreText = new BitmapText('Score: $0', {
      fontName: 'Edit Undo',
      fontSize: 14,
      tint: 0x935e53,
    });
    this.scoreText.x = 4;
    this.scoreText.y = 2;
    this.container.addChild(this.scoreText);

    // Boost text
    this.boostText = new BitmapText('Boost: ', {
      fontName: 'Edit Undo',
      fontSize: 14,
      tint: 0x935e53,
    });
    this.boostText.x = 4;
    this.boostText.y = 15;
    this.container.addChild(this.boostText);

    // Name text
    this.nameText = new BitmapText('', {
      fontName: 'Edit Undo',
      fontSize: 14,
      align: 'right',
      tint: 0xc20c0c,
    });
    this.nameText.x = 4;
    this.nameText.y = 28;
    this.container.addChild(this.nameText);
  }

  updateName() {
    this.nameText.text = this.game.player.name;
  }

  updateBoost() {
    this.boostText.text = 'Boost: ' + this.game.boosts;
  }

  updateScore() {
    this.scoreText.text = 'Score: $' + this.game.score;
  }

  reset() {
    this.updateName();
    this.updateBoost();
    this.updateScore();
  }
}
