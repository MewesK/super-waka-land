import { Container, Sprite } from 'pixi.js';

export default class Background {
  game;
  container = new Container();

  background1Sprite;
  background2aSprite;
  background2bSprite;
  background3aSprite;
  background3bSprite;

  constructor(game) {
    this.game = game;

    // Sprites
    this.background1Sprite = Sprite.from('bg_wakaland_1');

    this.background2aSprite = Sprite.from('bg_wakaland_2');
    this.background2aSprite.y = this.game.app.screen.height - 96;

    this.background2bSprite = Sprite.from('bg_wakaland_2');
    this.background2bSprite.x = this.background2bSprite.width;
    this.background2bSprite.y = this.game.app.screen.height - 96;

    this.background3aSprite = Sprite.from('bg_wakaland_3');
    this.background3aSprite.y = this.game.app.screen.height - 32;

    this.background3bSprite = Sprite.from('bg_wakaland_3');
    this.background3bSprite.x = this.background3bSprite.width;
    this.background3bSprite.y = this.game.app.screen.height - 32;

    this.container.addChild(this.background1Sprite);
    this.container.addChild(this.background2aSprite);
    this.container.addChild(this.background3aSprite);
    this.container.addChild(this.background2bSprite);
    this.container.addChild(this.background3bSprite);
  }

  get width() {
    return this.background1Sprite.width;
  }

  get height() {
    return this.background1Sprite.height;
  }

  update(dt) {
    // Parallax scrolling
    this.background2aSprite.pivot.x += 0.2 * dt;
    if (this.background2aSprite.pivot.x >= this.game.app.screen.width) {
      this.background2aSprite.pivot.x = 0;
    }
    this.background2bSprite.pivot.x += 0.2 * dt;
    if (this.background2aSprite.pivot.x >= this.game.app.screen.width) {
      this.background2aSprite.pivot.x = 0;
    }
    this.background3aSprite.pivot.x += 0.25 * dt;
    if (this.background3aSprite.pivot.x >= this.game.app.screen.width) {
      this.background3aSprite.pivot.x = 0;
    }
    this.background3bSprite.pivot.x += 0.25 * dt;
    if (this.background3bSprite.pivot.x >= this.game.app.screen.width) {
      this.background3bSprite.pivot.x = 0;
    }
  }

  reset() {
    this.background2aSprite.pivot.x = 0;
    this.background3aSprite.pivot.x = 0;
    this.background2bSprite.pivot.x = 0;
    this.background3bSprite.pivot.x = 0;
  }
}
