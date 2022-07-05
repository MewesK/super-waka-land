import { BitmapText, Container, Sprite } from 'pixi.js';
import { OverlayType } from './managers/OverlayManager';

export default class HUD {
  OFFSET = 4;

  game;
  container = new Container();

  boostText;
  scoreText;
  nameText;
  settingsSprite;

  constructor(game) {
    this.game = game;

    // Score text
    this.scoreText = new BitmapText('Score: $0', {
      fontName: 'Edit Undo',
      fontSize: 14,
      tint: 0x935e53,
    });
    this.scoreText.x = this.OFFSET;
    this.scoreText.y = 2;
    this.container.addChild(this.scoreText);

    // Boost text
    this.boostText = new BitmapText('Boost: ', {
      fontName: 'Edit Undo',
      fontSize: 14,
      tint: 0x935e53,
    });
    this.boostText.x = this.OFFSET;
    this.boostText.y = 15;
    this.container.addChild(this.boostText);

    // Name text
    this.nameText = new BitmapText('', {
      fontName: 'Edit Undo',
      fontSize: 14,
      align: 'right',
      tint: 0xc20c0c,
    });
    this.nameText.x = Math.round(this.game.app.screen.width / 2 - this.nameText.width / 2);
    this.nameText.y = this.OFFSET;
    this.container.addChild(this.nameText);

    // Create settings sprite
    this.settingsSprite = Sprite.from('note');
    this.settingsSprite.x = this.game.app.screen.width - this.settingsSprite.width - this.OFFSET;
    this.settingsSprite.y = this.OFFSET;
    this.settingsSprite.interactive = true;
    this.settingsSprite.buttonMode = true;
    this.settingsSprite.on('pointerdown', (event) => {
      if (!this.game.overlayManager.current) {
        event.stopPropagation();
        this.game.overlayManager.open(OverlayType.SETTINGS);
      }
    });
    this.container.addChild(this.settingsSprite);
  }

  updateName() {
    this.nameText.text = this.game.player.name;
    this.nameText.x = Math.round(this.game.app.screen.width / 2 - this.nameText.width / 2);
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
