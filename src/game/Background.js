import { Container, Sprite } from 'pixi.js';

export default class Background {
  ISLAND_Y = 96;
  WAVE_Y = 32;
  ISLAND_SPEED = 1;
  WAVE_SPEED = 1.1;

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
    this.background2bSprite = Sprite.from('bg_wakaland_2');
    this.background3aSprite = Sprite.from('bg_wakaland_3');
    this.background3bSprite = Sprite.from('bg_wakaland_3');

    this.background2aSprite.y = this.game.app.screen.height - this.ISLAND_Y;
    this.background2bSprite.x = this.background2bSprite.width;
    this.background2bSprite.y = this.background2aSprite.y;
    this.background3aSprite.y = this.game.app.screen.height - this.WAVE_Y;
    this.background3bSprite.x = this.background3bSprite.width;
    this.background3bSprite.y = this.background3aSprite.y;

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
    const background2Dx = this.ISLAND_SPEED * dt;
    this.background2aSprite.x -= background2Dx;
    if (this.background2aSprite.x <= -this.background2aSprite.width) {
      this.background2aSprite.x = this.background2aSprite.width;
    }
    this.background2bSprite.x -= background2Dx;
    if (this.background2bSprite.x < -this.background2bSprite.width) {
      this.background2bSprite.x = this.background2bSprite.width;
    }
    const background3Dx = this.WAVE_SPEED * dt;
    this.background3aSprite.x -= background3Dx;
    if (this.background3aSprite.x < -this.background3aSprite.width) {
      this.background3aSprite.x = this.background3aSprite.width;
    }
    this.background3bSprite.x -= background3Dx;
    if (this.background3bSprite.x < -this.background3bSprite.width) {
      this.background3bSprite.x = this.background3bSprite.width;
    }
  }

  reset() {
  }
}
