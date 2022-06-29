import { CompositeTilemap } from '@pixi/tilemap';
import { Timer } from 'eventemitter3-timer';
import { Container, Rectangle } from 'pixi.js';

import { DEBUG, random } from './Utilities';
import ItemEffect, { ItemEffectType } from './effects/ItemEffect';

export const TileType = {
  VOID: 0,
  PLATFORM: 1,
  COIN: 2,
  COKE: 3,
};
export const DebugType = {
  INTERSECTING: 0,
  TOUCHING: 1,
  CHECKING: 2,
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
  debugTilemap;

  map = [[]];
  mapWith;
  mapFullWidth;
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
    this.debugTilemap = new CompositeTilemap();
    this.container.addChild(this.tilemap);
    if (DEBUG) {
      this.container.addChild(this.debugTilemap);
    }

    // Map
    this.mapWidth = Math.ceil(this.game.app.screen.width / this.TILE_WIDTH);
    this.mapFullWidth = this.mapWidth * 2;
    this.mapHeight = Math.ceil(this.game.app.screen.height / this.TILE_HEIGHT);
    this.createMap();

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

  setTile(x, y, value = TileType.VOID, random = null) {
    this.map[y][x] = { value, random, debug: this.map[y][x]?.debug };
  }

  setDebugTile(x, y, debug) {
    this.map[y][x] = { value: this.map[y][x].value, random: this.map[y][x].random, debug };
  }

  checkCollision(collectCoinCallback, collectCokeCallback, intersectFloorCallback, finishCallback) {
    // Calculate the tile indices around the player
    const tilemapXMin = Math.max(
      0,
      Math.floor(
        (this.tilemap.position.x + this.game.player.container.position.x) / this.TILE_WIDTH
      ) - 3
    );
    const tilemapXMax = Math.min(
      this.mapFullWidth - 1,
      Math.ceil(tilemapXMin + this.game.player.width / this.TILE_WIDTH + 3)
    );
    const tilemapYMin = Math.max(
      0,
      Math.floor(
        (this.tilemap.position.y + this.game.player.container.position.y) / this.TILE_HEIGHT
      ) - 3
    );
    const tilemapYMax = Math.min(
      this.mapHeight - 1,
      Math.ceil(tilemapYMin + this.game.player.height / this.TILE_HEIGHT + 3)
    );

    // Create player rectangle with screen coordinates
    const playerRectangle = new Rectangle(
      this.game.player.container.x,
      this.game.player.container.y,
      this.game.player.container.width,
      this.game.player.container.height
    );

    // Check for collisions
    let intersecting = false;
    let touching = false;
    let collecting = false;
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapFullWidth; x++) {
        const tile = this.map[y][x];
        // Check only non-void tiles
        if (tile.value !== TileType.VOID) {
          // Create tile rectangle with screen coordinates
          const tileRectangle = new Rectangle(
            this.tilemap.position.x + x * this.TILE_WIDTH,
            this.tilemap.position.y + y * this.TILE_HEIGHT,
            this.TILE_WIDTH,
            this.TILE_HEIGHT + (tile.value === TileType.COKE ? this.TILE_HEIGHT : 0)
          );
          // Is overlapping
          if (playerRectangle.intersects(tileRectangle)) {
            if (tile.value === TileType.COIN) {
              // Collect coin
              collecting = true;
              this.setTile(x, y, TileType.VOID);
              this.itemEffects.push(
                new ItemEffect(
                  this.game,
                  ItemEffectType.Coin,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );

              // Callback
              collectCoinCallback(tileRectangle);
            } else if (tile.value === TileType.COKE) {
              // Collect coke
              collecting = true;
              this.setTile(x, y, TileType.VOID);
              this.itemEffects.push(
                new ItemEffect(
                  this.game,
                  ItemEffectType.Coke,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );

              // Callback
              collectCokeCallback(tileRectangle);
            } else if (
              tile.value === TileType.PLATFORM &&
              this.game.player.lastPosition.y + this.game.player.height <= tileRectangle.y // Was player previoulsy above the tile?
            ) {
              intersecting = true;

              // Callback
              intersectFloorCallback(tileRectangle);
            }

            // Debug overlay
            this.setDebugTile(x, y, DebugType.INTERSECTING);
          } else {
            if (playerRectangle.intersects(tileRectangle.clone().pad(0, 0.1))) {
              if (
                tile.value === TileType.PLATFORM &&
                this.game.player.lastPosition.y + this.game.player.height <= tileRectangle.y // Was player previoulsy above the tile?
              ) {
                touching = true;
              }
              // Debug overlay
              this.setDebugTile(x, y, DebugType.TOUCHING);
            }
          }
        }
      }
    }

    // Redraw tilemap if an item has been collected
    if (collecting || DEBUG) {
      this.createTilemap(false);
    }

    // Callback
    finishCallback(intersecting, touching, collecting);
  }

  createMap() {
    for (let y = 0; y < this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x < this.mapFullWidth; x++) {
        this.setTile(x, y, y === this.FLOOR_Y ? TileType.PLATFORM : TileType.VOID, random(0, 3));
      }
    }

    // Create tilemap
    this.createTilemap();
  }

  createTilemap(resetPosition = true) {
    this.tilemap.clear();
    this.debugTilemap.clear();

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapFullWidth; x++) {
        if (this.map[y][x].value === TileType.COIN) {
          this.tilemap
            .tile('gold_coin1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT)
            .tileAnimX(16, 5);
        } else if (this.map[y][x].value === TileType.COKE) {
          this.tilemap.tile('coke1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT).tileAnimX(13, 2);
        } else if (this.map[y][x].value === TileType.PLATFORM) {
          let tile = null;

          // Platform start
          if (x > 0 && this.map[y][x - 1].value === TileType.VOID) {
            tile = 'planks1';
          }

          // Platform end
          else if (x + 1 < this.map[y].length && this.map[y][x + 1].value === TileType.VOID) {
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
        if (DEBUG) {
          if (this.map[y][x].debug === DebugType.INTERSECTING) {
            this.debugTilemap.tile('debug1', x * this.TILE_WIDTH, y * this.TILE_HEIGHT);
          } else if (this.map[y][x].debug === DebugType.TOUCHING) {
            this.debugTilemap.tile('debug2', x * this.TILE_WIDTH, y * this.TILE_HEIGHT);
          } else if (this.map[y][x].debug === DebugType.CHECKING) {
            this.debugTilemap.tile('debug3', x * this.TILE_WIDTH, y * this.TILE_HEIGHT);
          }
        }
      }
    }
    if (resetPosition) {
      this.tilemap.position.set(0, 0);
      this.debugTilemap.position.set(0, 0);
    }
  }

  generateMap(dt) {
    console.debug('Generating map');

    // Move second half to the first
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = this.mapWidth; x < this.mapFullWidth; x++) {
        this.setTile(x - this.mapWidth, y, this.map[y][x].value, this.map[y][x].random);
        this.setDebugTile(x - this.mapWidth, y, this.map[y][x].debug);
        this.setTile(x, y, TileType.VOID);
        this.setDebugTile(x, y, undefined);
      }
    }

    if (this.game.paused) {
      // Generate new tiles for the title screen level
      for (let x = this.mapWidth; x <= this.mapFullWidth; x++) {
        this.setTile(x, this.FLOOR_Y, TileType.PLATFORM, random(0, 3));
      }
    } else {
      // Generate new tiles for the real level
      for (let x = this.mapWidth; x < this.mapFullWidth; x++) {
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
            this.setTile(x, this.platformY - 4, TileType.COKE);
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
            this.setTile(x, this.platformY - 3, TileType.COIN);
          }

          // Fill platform
          this.setTile(x, this.platformY, TileType.PLATFORM, random(0, 3));
          this.platformX--;
        }
      }
    }

    // Create tilemap
    this.createTilemap();
  }

  update(dt) {
    // Update timers
    this.animationTimer.update(this.game.app.ticker.elapsedMS);

    // Update effects
    this.itemEffects.forEach((itemEffect) => itemEffect.update(dt));

    // Update tilemap position
    this.tilemap.position.x -= this.game.player.position.x - this.game.player.lastPosition.x;
    if (DEBUG) {
      this.debugTilemap.position.x -= this.game.player.position.x - this.game.player.lastPosition.x;
    }

    // Check if we need to create new tiles
    if (this.tilemap.position.x <= -(this.mapWidth * this.TILE_WIDTH)) {
      this.generateMap(dt);
    }
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
}
