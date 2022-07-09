import { Container, Sprite } from 'pixi.js';

export default class Background {
  DATA = [
    [
      { sprites: [Sprite.from('bg1')], offset: 224, speed: 0 },
      {
        sprites: [
          Sprite.from('bg2b'),
          Sprite.from('bg2a'),
          Sprite.from('bg2b'),
          Sprite.from('bg2c'),
          Sprite.from('bg2b'),
          Sprite.from('bg2a'),
        ],
        offset: 96,
        speed: 0.6,
      },
      {
        sprites: [Sprite.from('bg3'), Sprite.from('bg3')],
        offset: 32,
        speed: 0.7,
      },
    ],
  ];

  game;
  container = new Container();

  // Properties
  #style;

  constructor(game) {
    this.game = game;
    this.style = 0;
  }

  get style() {
    return this.#style;
  }

  set style(value) {
    if (this.#style === value) {
      return;
    }
    this.#style = value;

    this.container.removeChildren();
    this.DATA[this.#style].forEach((layer) => {
      layer.sprites.forEach((sprite, index) => {
        this.container.addChild(sprite);
        sprite.x = index * sprite.width;
        sprite.y = this.game.app.screen.height - layer.offset;
      });
    });
  }

  get width() {
    return this.DATA[this.#style][0].sprites.width;
  }

  get height() {
    return this.DATA[this.#style][0].sprites.height;
  }

  update(dt) {
    this.DATA[this.#style].forEach((layer) => {
      layer.sprites.forEach((sprite) => {
        sprite.x -= this.game.player.velocity.x * layer.speed * dt;
        if (sprite.x <= -sprite.width) {
          sprite.x = sprite.width * (layer.sprites.length - 1);
        }
      });
    });
  }
}
