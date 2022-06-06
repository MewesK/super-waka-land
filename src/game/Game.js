import { CompositeTilemap } from '@pixi/tilemap';
import { Timer } from 'eventemitter3-timer';
import { Sprite, Container, Rectangle, filters, BitmapText, UPDATE_PRIORITY } from 'pixi.js';
import Background from './Background';

import ItemEffect, { ItemEffectType } from './effects/ItemEffect';
import Player from './Player';
import { intersect, random } from './Utilities';

const TileType = {
  Void: 0,
  Platform: 1,
  Coin: 2,
  Coke: 3,
};

export default class Game {
  FLOOR_Y = 12;
  FLOOR_Y_MIN = 5;
  FLOOR_Y_MAX = 13;
  TILE_WIDTH = 16;
  TILE_HEIGHT = 16;

  app;
  container = new Container();
  levelContainer = new Container();

  player;
  background;

  // Properties
  score = 0;
  boosts = 0;
  map = [[]];

  // Timers
  animationTimer = null;

  // Effects
  itemEffects = [];

  // Sprites
  tilemap;
  scoreText;
  boostText;

  gameOver = new Container();
  gameOverText1;
  gameOverText2;

  // Temp
  abyssX = 0;
  abyssLength = 0;
  platformX = 0;
  platformY = this.FLOOR_Y;
  platformLength = 0;
  lastTilemapX = 0;

  primaryActionPressed = false;
  secondaryActionPressed = false;

  constructor(app) {
    this.app = app;
    this.player = new Player(this);
    this.background = new Background(this);

    this.createSprites();

    // Add timer
    this.animationTimer = new Timer(150);
    this.animationTimer.loop = true;
    this.animationTimer.on('repeat', (elapsedTime, repeat) => {
      // Update tile animations
      this.app.renderer.plugins.tilemap.tileAnim[0] = repeat;
      this.app.renderer.plugins.tilemap.tileAnim[1] = repeat;
    });
    this.animationTimer.start();

    this.reset();

    // Compose stage
    this.levelContainer.addChild(this.background.container);
    this.levelContainer.addChild(this.tilemap);
    this.levelContainer.addChild(this.player.container);
    this.levelContainer.addChild(this.scoreText);
    this.levelContainer.addChild(this.boostText);
    this.container.addChild(this.levelContainer);

    this.app.stage.interactive = true;
    this.app.stage.addChild(this.container);
    this.app.renderer.render(this.app.stage);

    // Register event listeners
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyW') {
        event.preventDefault();
        event.stopPropagation();
        this.startPrimaryAction();
      }
      if (event.code === 'KeyD') {
        event.preventDefault();
        event.stopPropagation();
        this.startSecondaryAction();
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyW') {
        event.preventDefault();
        event.stopPropagation();
        this.endPrimaryAction();
      }
      if (event.code === 'KeyD') {
        event.preventDefault();
        event.stopPropagation();
        this.endSecondaryAction();
      }
    });
    app.stage.on('pointerdown', (event) => {
      event.stopPropagation();
      this.startPrimaryAction();
    });
    app.stage.on('pointerup', (event) => {
      event.stopPropagation();
      this.endPrimaryAction();
    });

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  startPrimaryAction() {
    if (this.primaryActionPressed) {
      return;
    }
    this.primaryActionPressed = true;

    if (this.player.dead) {
      this.reset();
    } else if (!this.player.airborne) {
      this.player.startJump();
    }
  }

  endPrimaryAction() {
    if (!this.primaryActionPressed) {
      return;
    }
    this.primaryActionPressed = false;
    this.player.endJump();
  }

  startSecondaryAction() {
    if (this.secondaryActionPressed) {
      return;
    }
    this.secondaryActionPressed = true;

    if (this.boosts > 0) {
      this.increaseBoost(-1);
      this.player.startBoost();
    }
  }

  endSecondaryAction() {
    if (!this.secondaryActionPressed) {
      return;
    }
    this.secondaryActionPressed = false;
  }

  checkCollision() {
    // Calculate the tile indices around the player
    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
    const tilemapY = this.tilemap.pivot.y % this.app.screen.height;
    const tilemapXMin = Math.max(
      0,
      Math.floor((tilemapX + this.player.container.position.x) / this.TILE_WIDTH) - 1
    );
    const tilemapXMax = Math.min(
      this.mapWidth,
      tilemapXMin + Math.ceil(this.player.width / this.TILE_WIDTH) + 1
    );
    const tilemapYMin = Math.max(
      0,
      Math.floor((tilemapY + this.player.container.position.y) / this.TILE_HEIGHT) - 1
    );
    const tilemapYMax = Math.min(
      this.mapHeight,
      tilemapYMin + Math.ceil(this.player.height / this.TILE_HEIGHT) + 1
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
          if ((intersectRect = intersect(this.player.container, tileRectangle))) {
            if (tile.value === TileType.Coin && intersectRect.height > 0) {
              // Collect coin
              collecting = true;
              this.setTile(x, y, TileType.Void);
              this.increaseScore(10);
              this.itemEffects.push(
                new ItemEffect(
                  this,
                  ItemEffectType.Coin,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );
            } else if (tile.value === TileType.Coke && intersectRect.height > 0) {
              // Collect coke
              collecting = true;
              this.setTile(x, y, TileType.Void);
              this.increaseScore(50);
              this.increaseBoost(1);
              this.itemEffects.push(
                new ItemEffect(
                  this,
                  ItemEffectType.Coke,
                  tileRectangle.x - tileRectangle.width / 2,
                  tileRectangle.y + tileRectangle.height / 2
                )
              );
            } else if (
              tile.value === TileType.Platform &&
              this.player.lastPosition.y + this.player.height <= tileRectangle.y
            ) {
              intersecting = true;

              // Fix position and cancel falling
              this.player.setVelocity(null, 0, true);
              this.player.setPosition(null, tileRectangle.y - this.player.height, true);

              // Check for landing
              if (this.player.airborne) {
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

    this.player.airborne = !intersecting;

    // Start jumping if just landed but still holding key
    if (landing && this.primaryActionPressed) {
      console.debug('Early jump');
      this.player.startJump();
    }

    // Redraw tilemap if an item has been collected
    if (collecting) {
      this.createTilemap(false);
    }
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.itemEffects.forEach((itemEffect) => itemEffect.destroy());

      const filter1 = new filters.ColorMatrixFilter();
      filter1.desaturate();
      const filter2 = new filters.ColorMatrixFilter();
      filter2.brightness(0.5, false);
      this.levelContainer.filterArea = new Rectangle(
        0,
        0,
        this.levelContainer.width,
        this.levelContainer.height
      );
      this.levelContainer.filters = [filter1, filter2];

      this.gameOverText2.text = 'Final Score: ' + this.score;
      this.gameOverText2.x = this.app.screen.width / 2 - this.gameOverText2.width / 2;

      this.container.addChild(this.gameOver);
    }
  }

  createSprites() {
    // Tilemap
    this.tilemap = new CompositeTilemap();

    // Score text
    this.scoreText = new BitmapText('Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.scoreText.x = 2;

    // Boost text
    this.boostText = new BitmapText('Boost: ', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.boostText.x = 2;
    this.boostText.y = 10;

    // Game over screen
    this.gameOverText1 = new BitmapText('Game Over', {
      fontName: 'Edit Undo',
      fontSize: 30,
    });
    this.gameOver.addChild(this.gameOverText1);
    this.gameOverText1.x = this.app.screen.width / 2 - this.gameOverText1.width / 2;

    this.gameOverText2 = new BitmapText('Final Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
    });
    this.gameOver.addChild(this.gameOverText2);
    this.gameOverText2.x = this.app.screen.width / 2 - this.gameOverText2.width / 2;
    this.gameOverText2.y = 30;

    this.gameOver.y = this.app.screen.height / 2 - this.gameOver.height / 2;
  }

  createMap() {
    this.mapWidth = Math.ceil(this.app.screen.width / this.TILE_WIDTH) * 2;
    this.mapHeight = Math.ceil(this.app.screen.height / this.TILE_HEIGHT);

    for (let y = 0; y <= this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        this.setTile(x, y, y === this.FLOOR_Y ? TileType.Platform : TileType.Void, random(0, 3));
      }
    }

    // Draw tilemap
    this.createTilemap();
  }

  createNewTiles() {
    // Check if we need to create new tiles
    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
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
      this.tilemap.position.set(this.player.position.x, this.tilemap.position.y);
    }
    this.lastTilemapX = tilemapX;
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

  increaseScore(value) {
    this.score += value;
    this.scoreText.text = 'Score: ' + this.score;
  }

  increaseBoost(value) {
    this.boosts += value;
    this.boostText.text = 'Boost: ' + this.boosts;
  }

  setTile(x, y, value = TileType.Void, random = null) {
    this.map[y][x] = { value, random };
  }

  update(dt) {
    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    this.app.stats.begin();

    // Update timers
    this.animationTimer.timerManager.update(this.app.ticker.elapsedMS);

    this.createNewTiles();
    this.player.update(dt);
    this.checkCollision();
    this.background.update(dt);
    this.tilemap.pivot.x = this.player.position.x;
    this.itemEffects.forEach((itemEffect) => itemEffect.update(dt));
    this.checkGameOver();

    // End performance measurement
    this.app.stats.end();
  }

  reset() {
    this.container.removeChild(this.gameOver);
    this.levelContainer.filters = null;

    this.player.reset();
    this.background.reset();

    // Properties
    this.score = 0;
    this.boosts = 0;
    this.createMap();

    // Timers
    this.animationTimer.reset();

    // Effects
    this.itemEffects.forEach((itemEffect) => itemEffect.destroy());

    // Sprites
    this.increaseScore(0);
    this.increaseBoost(0);

    // Temp
    this.abyssX = 0;
    this.abyssLength = 0;
    this.platformX = 0;
    this.platformY = this.FLOOR_Y;
    this.platformLength = 0;
    this.lastTilemapX = 0;

    this.primaryActionPressed = false;
    this.secondaryActionPressed = false;
  }
}
