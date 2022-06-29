import { Container, Sprite } from 'pixi.js';

export default class Background {
  SPRITES = [
    {
      background1Sprite: Sprite.from('rat_bg1'),
      background2aSprite: Sprite.from('rat_bg2'),
      background2bSprite: Sprite.from('rat_bg2'),
      background3aSprite: Sprite.from('rat_bg3'),
      background3bSprite: Sprite.from('rat_bg3'),
    },
    {
      background1Sprite: Sprite.from('rat_bg1'),
      background2aSprite: Sprite.from('orange_bg2'),
      background2bSprite: Sprite.from('orange_bg2'),
      background3aSprite: Sprite.from('rat_bg3'),
      background3bSprite: Sprite.from('rat_bg3'),
    },
  ];
  ISLAND_Y = 96;
  WAVE_Y = 32;
  ISLAND_SPEED = 1;
  WAVE_SPEED = 1.1;

  game;
  container = new Container();

  // Properties
  #character;

  constructor(game) {
    this.game = game;
    this.character = 0;
  }

  get character() {
    return this.#character;
  }

  set character(value) {
    if (this.#character === value) {
      return;
    }
    this.#character = value;

    this.container.removeChildren();

    this.container.addChild(this.background1Sprite);

    this.container.addChild(this.background2aSprite);
    this.background2aSprite.x = 0;
    this.background2aSprite.y = this.game.app.screen.height - this.ISLAND_Y;

    this.container.addChild(this.background2bSprite);
    this.background2bSprite.x = this.background2bSprite.width;
    this.background2bSprite.y = this.background2aSprite.y;

    this.container.addChild(this.background3aSprite);
    this.background3aSprite.x = 0;
    this.background3aSprite.y = this.game.app.screen.height - this.WAVE_Y;

    this.container.addChild(this.background3bSprite);
    this.background3bSprite.x = this.background3bSprite.width;
    this.background3bSprite.y = this.background3aSprite.y;
  }

  get background1Sprite() {
    return this.SPRITES[this.#character].background1Sprite;
  }
  get background2aSprite() {
    return this.SPRITES[this.#character].background2aSprite;
  }
  get background2bSprite() {
    return this.SPRITES[this.#character].background2bSprite;
  }
  get background3aSprite() {
    return this.SPRITES[this.#character].background3aSprite;
  }
  get background3bSprite() {
    return this.SPRITES[this.#character].background3bSprite;
  }

  get width() {
    return this.background1Sprite.width;
  }

  get height() {
    return this.background1Sprite.height;
  }

  update(dt) {
    const background2Dx = (this.game.player.velocity.x / 10 + this.ISLAND_SPEED) * dt;
    this.background2aSprite.x -= background2Dx;
    if (this.background2aSprite.x <= -this.background2aSprite.width) {
      this.background2aSprite.x = this.background2aSprite.width;
    }
    this.background2bSprite.x -= background2Dx;
    if (this.background2bSprite.x < -this.background2bSprite.width) {
      this.background2bSprite.x = this.background2bSprite.width;
    }
    const background3Dx = (this.game.player.velocity.x / 10 + this.WAVE_SPEED) * dt;
    this.background3aSprite.x -= background3Dx;
    if (this.background3aSprite.x < -this.background3aSprite.width) {
      this.background3aSprite.x = this.background3aSprite.width;
    }
    this.background3bSprite.x -= background3Dx;
    if (this.background3bSprite.x < -this.background3bSprite.width) {
      this.background3bSprite.x = this.background3bSprite.width;
    }
  }

  reset() {}
}
