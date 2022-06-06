import { CompositeTilemap } from '@pixi/tilemap';
import { Timer } from 'eventemitter3-timer';
import { Container, Rectangle } from 'pixi.js';

import ItemEffect, { ItemEffectType } from './effects/ItemEffect';
import { intersect, random } from './Utilities';

export const TileType = {
  Void: 0,
  Platform: 1,
  Coin: 2,
  Coke: 3,
};

export default class Map {
  FLOOR_Y = 12;
  FLOOR_Y_MIN = 5;
  FLOOR_Y_MAX = 13;
  TILE_WIDTH = 16;
  TILE_HEIGHT = 16;

  game;
  container = new Container();
  tilemap;

  map = [[]];
  mapWith;
  mapHeight;

  // Timers
  animationTimer;

  // Effects
  itemEffects = [];

  // Temp
  abyssX = 0;
  abyssLength = 0;
  platformX = 0;
  platformY = this.FLOOR_Y;
  platformLength = 0;
  lastTilemapX = 0;

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
      this.mapWidth,
      tilemapXMin + Math.ceil(this.game.player.width / this.TILE_WIDTH) + 1
    );
    const tilemapYMin = Math.max(
      0,
      Math.floor((tilemapY + this.game.player.container.position.y) / this.TILE_HEIGHT) - 1
    );
    const tilemapYMax = Math.min(
      this.mapHeight,
      tilemapYMin + Math.ceil(this.game.player.height / this.TILE_HEIGHT) + 1
    );

    // Check for collisions
    let intersecting = false;
    let landing = false;
    let collecting = false;
    for (let y = tilemapYMin; y <= tilemapYMax; y++) {
      for (let x = tilemapXMin; x <= tilemapXMax; x++) {
        const tile = this.map[y][x];

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
              this.setTile(x, y, TileType.Void);
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
              this.setTile(x, y, TileType.Void);
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
      this.createTilemap(false);
    }
  }

  createMap() {
    this.mapWidth = Math.ceil(this.game.app.screen.width / this.TILE_WIDTH) * 2;
    this.mapHeight = Math.ceil(this.game.app.screen.height / this.TILE_HEIGHT);

    for (let y = 0; y <= this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        this.setTile(x, y, y === this.FLOOR_Y ? TileType.Platform : TileType.Void, random(0, 3));
      }
    }

    // Draw tilemap
    this.createTilemap();
  }

  createTilemap(resetPosition = true) {
    this.tilemap.clear();
    for (let y = 0; y <= this.mapHeight; y++) {
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        if (this.map[y][x].value === TileType.Coin) {
          this.tilemap
            .tile('gold_coin1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT)
            .tileAnimX(16, 5);
        } else if (this.map[y][x].value === TileType.Coke) {
          this.tilemap.tile('coke1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT).tileAnimX(13, 2);
        } else if (this.map[y][x].value === TileType.Platform) {
          let tile = null;

          // Platform start
          if (x > 0 && this.map[y][x - 1].value === TileType.Void) {
            tile = 'planks1';
          }

          // Platform end
          else if (x + 1 < this.map[y].length && this.map[y][x + 1].value === TileType.Void) {
            tile = 'planks5';
          }

          // Platform
          else {
            if (this.map[y][x].random === 0) {
              tile = 'planks2';
            } else if (this.map[y][x].random === 1) {
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

  generateMap() {
    // Check if we need to create new tiles
    const tilemapX = this.tilemap.pivot.x % this.game.app.screen.width;
    if (tilemapX < this.lastTilemapX) {
      // Move second half to the first
      for (let y = 0; y <= this.mapHeight; y++) {
        for (let x = this.mapWidth / 2; x <= this.mapWidth; x++) {
          this.setTile(x - this.mapWidth / 2, y, this.map[y][x].value, this.map[y][x].random);
          this.setTile(x, y, TileType.Void);
        }
      }

      // Generate new tiles for the second half
      for (let x = this.mapWidth / 2 + 1; x <= this.mapWidth; x++) {
        // Generate new section if necessary
        if (this.platformX === 0) {
          this.abyssLength = random(3, 6);
          this.abyssX = this.abyssLength;
          this.platformY = random(
            Math.min(
              this.FLOOR_Y_MAX,
              Math.max(this.FLOOR_Y_MIN, this.platformY - 7 + this.abyssLength)
            ),
            this.FLOOR_Y_MAX
          );
          this.platformLength = random(2, 8);
          this.platformX = this.platformLength;
        }

        // Fill current section
        if (this.abyssX > 0) {
          // Fill coke
          if (this.abyssLength % this.abyssX === 2 && random(0, 2) >= 1) {
            this.setTile(x, this.platformY - 4, TileType.Coke);
          }

          // Fill abyss
          this.abyssX--;
        } else {
          // Fill coin
          if (
            this.platformLength >= 3 &&
            this.platformX < this.platformLength &&
            this.platformX - 1 > 0
          ) {
            this.setTile(x, this.platformY - 3, TileType.Coin);
          }

          // Fill platform
          this.setTile(x, this.platformY, TileType.Platform, random(0, 3));
          this.platformX--;
        }
      }

      // Redraw tilemap
      this.createTilemap();

      // Reset tilemap position
      this.tilemap.position.set(this.game.player.position.x, this.tilemap.position.y);
    }
    this.lastTilemapX = tilemapX;
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
    this.createMap();

    // Timers
    this.animationTimer.reset();

    // Effects
    this.itemEffects.forEach((itemEffect) => itemEffect.destroy());

    // Temp
    this.abyssX = 0;
    this.abyssLength = 0;
    this.platformX = 0;
    this.platformY = this.FLOOR_Y;
    this.platformLength = 0;
    this.lastTilemapX = 0;
  }

  setTile(x, y, value = TileType.Void, random = null) {
    this.map[y][x] = { value, random };
  }
}
