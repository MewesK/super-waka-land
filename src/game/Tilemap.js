import { CompositeTilemap } from '@pixi/tilemap';
import { Timer } from 'eventemitter3-timer';
import { Container, Rectangle } from 'pixi.js';

import ItemEffect, { ItemEffectType } from './effects/ItemEffect';
import { intersect } from './Utilities';

export const TileType = {
  Void: 0,
  Platform: 1,
  Coin: 2,
  Coke: 3,
};

export default class Tilemap {
  TILE_WIDTH = 16;
  TILE_HEIGHT = 16;

  game;
  container = new Container();

  tilemap;

  // Timers
  animationTimer;

  // Effects
  itemEffects = [];

  constructor(game) {
    this.game = game;

    // Tilemap
    this.tilemap = new CompositeTilemap();
    this.container.addChild(this.tilemap);

    // Add timer
    this.animationTimer = new Timer(150);
    this.animationTimer.loop = true;
    this.animationTimer.on('repeat', (elapsedTime, repeat) => {
      // Update tile animations
      this.game.app.renderer.plugins.tilemap.tileAnim[0] = repeat;
      this.game.app.renderer.plugins.tilemap.tileAnim[1] = repeat;
    });
    this.animationTimer.start();
  }

  checkCollision() {
    // Calculate the tile indices around the player
    const tilemapX = this.tilemap.pivot.x % this.game.app.screen.width;
    const tilemapY = this.tilemap.pivot.y % this.game.app.screen.height;
    const tilemapXMin = Math.max(
      0,
      Math.floor((tilemapX + this.game.player.container.position.x) / this.TILE_WIDTH) - 1
    );
    const tilemapXMax = Math.min(
      this.game.mapWidth,
      tilemapXMin + Math.ceil(this.game.player.width / this.TILE_WIDTH) + 1
    );
    const tilemapYMin = Math.max(
      0,
      Math.floor((tilemapY + this.game.player.container.position.y) / this.TILE_HEIGHT) - 1
    );
    const tilemapYMax = Math.min(
      this.game.mapHeight,
      tilemapYMin + Math.ceil(this.game.player.height / this.TILE_HEIGHT) + 1
    );

    // Check for collisions
    let intersecting = false;
    let landing = false;
    let collecting = false;
    for (let y = tilemapYMin; y <= tilemapYMax; y++) {
      for (let x = tilemapXMin; x <= tilemapXMax; x++) {
        const tile = this.game.map[y][x];

        if (tile.value !== TileType.Void) {
          // Create tile rectangle with screen coordinates
          const tileRectangle = new Rectangle(
            x * this.TILE_WIDTH - tilemapX,
            y * this.TILE_HEIGHT - tilemapY,
            this.TILE_WIDTH,
            this.TILE_HEIGHT + (tile.value === TileType.Coke ? this.TILE_HEIGHT : 0)
          );

          // Is overlapping and player was previously above the tile?
          let intersectRect;
          if ((intersectRect = intersect(this.game.player.container, tileRectangle))) {
            if (tile.value === TileType.Coin && intersectRect.height > 0) {
              // Collect coin
              collecting = true;
              this.game.setTile(x, y, TileType.Void);
              this.game.increaseScore(10);
              this.itemEffects.push(
                new ItemEffect(
                  this.game,
                  ItemEffectType.Coin,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );
            } else if (tile.value === TileType.Coke && intersectRect.height > 0) {
              // Collect coke
              collecting = true;
              this.game.setTile(x, y, TileType.Void);
              this.game.increaseScore(50);
              this.game.increaseBoost(1);
              this.itemEffects.push(
                new ItemEffect(
                  this.game,
                  ItemEffectType.Coke,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );
            } else if (
              tile.value === TileType.Platform &&
              this.game.player.lastPosition.y + this.game.player.height <= tileRectangle.y
            ) {
              intersecting = true;

              // Fix position and cancel falling
              this.game.player.setVelocity(null, 0, true);
              this.game.player.setPosition(null, tileRectangle.y - this.game.player.height, true);

              // Check for landing
              if (this.game.player.airborne) {
                console.debug('Landed');
                landing = true;
              }

              // One collision is enough
              break;
            }
          }
        }
      }
    }

    this.game.player.airborne = !intersecting;

    // Start jumping if just landed but still holding key
    if (landing && this.game.primaryActionPressed) {
      console.debug('Early jump');
      this.game.player.startJump();
    }

    // Redraw tilemap if an item has been collected
    if (collecting) {
      this.create(false);
    }
  }

  create(resetPosition = true) {
    this.tilemap.clear();
    for (let y = 0; y <= this.game.mapHeight; y++) {
      for (let x = 0; x <= this.game.mapWidth * 2; x++) {
        if (this.game.map[y][x].value === TileType.Coin) {
          this.tilemap
            .tile('gold_coin1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT)
            .tileAnimX(16, 5);
        } else if (this.game.map[y][x].value === TileType.Coke) {
          this.tilemap.tile('coke1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT).tileAnimX(13, 2);
        } else if (this.game.map[y][x].value === TileType.Platform) {
          let tile = null;

          // Platform start
          if (x > 0 && this.game.map[y][x - 1].value === TileType.Void) {
            tile = 'planks1';
          }

          // Platform end
          else if (
            x + 1 < this.game.map[y].length &&
            this.game.map[y][x + 1].value === TileType.Void
          ) {
            tile = 'planks5';
          }

          // Platform
          else {
            if (this.game.map[y][x].random === 0) {
              tile = 'planks2';
            } else if (this.game.map[y][x].random === 1) {
              tile = 'planks4';
            } else {
              tile = 'planks3';
            }
          }

          this.tilemap.tile(tile, x * this.TILE_WIDTH, y * this.TILE_HEIGHT);
        }
      }
    }
    if (resetPosition) {
      this.tilemap.position.set(0, 0);
      this.tilemap.pivot.set(0, 0);
    }
  }

  update(dt) {
    // Update timers
    this.animationTimer.update(this.game.app.ticker.elapsedMS);

    // Update tilemap position
    this.tilemap.pivot.x = this.game.player.position.x;

    // Update effects
    this.itemEffects.forEach((itemEffect) => itemEffect.update(dt));
  }

  reset() {
    // Timers
    this.animationTimer.reset();

    // Effects
    this.itemEffects.forEach((itemEffect) => itemEffect.destroy());
  }
}
