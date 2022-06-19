import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { Sprite } from 'pixi.js';

import boostEmitterConfig from './emitters/boostEmitterConfig.json';

export default class BoostEffect {
  CONFIG = boostEmitterConfig;
  TEXTURE = 'particle_dot';

  game;
  emitter;

  constructor(game) {
    this.game = game;
    this.emitter = new Emitter(
      this.game.app.stage,
      upgradeConfig(this.CONFIG, [Sprite.from(this.TEXTURE).texture])
    );
  }

  get width() {
    return this.TEXTURES[0].width;
  }

  get height() {
    return this.TEXTURES[0].height;
  }

  start() {
    this.update();
    this.emitter.emit = true;
  }

  stop() {
    this.emitter.emit = false;
  }

  update(dt) {
    this.emitter.updateOwnerPos(
      this.game.player.container.position.x + this.game.player.width / 2,
      this.game.player.container.position.y + this.game.player.height
    );
  }
}
