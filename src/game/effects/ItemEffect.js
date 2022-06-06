import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { Sprite } from 'pixi.js';

import coinEmitterConfig from '../../assets/emitters/coinEmitterConfig.json';
import cokeEmitterConfig from '../../assets/emitters/cokeEmitterConfig.json';

export const ItemEffectType = {
  Coin: { CONFIG: coinEmitterConfig, TEXTURE: 'particle_dot' },
  Coke: { CONFIG: cokeEmitterConfig, TEXTURE: 'particle_bubble' },
};

export default class ItemEffect {
  game;
  typ;
  emitter;

  constructor(game, type, x, y) {
    this.game = game;
    this.type = type;
    this.emitter = new Emitter(
      this.game.map.container,
      upgradeConfig(type.CONFIG, [Sprite.from(type.TEXTURE).texture])
    );
    this.emitter.rotate(200);
    this.emitter.updateOwnerPos(x, y);
    this.emitter.playOnceAndDestroy();
  }

  get width() {
    return this.type.TEXTURES[0].width;
  }

  get height() {
    return this.type.TEXTURES[0].height;
  }

  destroy() {
    this.emitter.destroy();
  }

  update(dt) {
    // Do nothing
  }
}
