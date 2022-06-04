import {
  AnimatedSprite,
  Point,
  Sprite,
  Container,
  Rectangle,
  filters,
  BitmapText,
  UPDATE_PRIORITY,
} from 'pixi.js';
import { CompositeTilemap } from '@pixi/tilemap';
import { Timer } from 'eventemitter3-timer';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { intersect, random } from './utilities';

import boostEmitterConfig from './emitter.json';

const Tile = {
  void: 0,
  platform: 1,
  coin: 2,
};

export default class Level {
  app;
  player;
  score = 0;
  cokes = [];
  map = [[]];
  container = new Container();
  levelContainer = new Container();

  // Properties
  gravity = 0.3;
  startFloorY = 12;
  minFloorY = 5;
  maxFloorY = 13;
  tileWidth = 16;
  tileHeight = 16;

  // Sprites
  background1Sprite;
  background2aSprite;
  background2bSprite;
  background3aSprite;
  background3bSprite;
  tilemap;
  scoreText;

  gameOver = new Container();
  gameOverText1;
  gameOverText2;

  // Particle emitters
  boostEmitter;

  // Temp
  abyssLength = 0;
  platformX = 0;
  platformY = this.startFloorY;
  platformLength = 0;
  lastTilemapX = 0;

  coinAnimationTimer = null;
  primaryActionTimer = null;
  secondaryActionTimer = null;
  actionPressed = false;

  constructor(app, player) {
    this.app = app;
    this.player = player;

    this.createSprites();
    this.reset();

    // Compose stage
    this.levelContainer.addChild(this.background1Sprite);
    this.levelContainer.addChild(this.background2aSprite);
    this.levelContainer.addChild(this.background3aSprite);
    this.levelContainer.addChild(this.background2bSprite);
    this.levelContainer.addChild(this.background3bSprite);
    this.levelContainer.addChild(this.tilemap);
    this.levelContainer.addChild(this.player.container);
    this.levelContainer.addChild(this.scoreText);
    this.container.addChild(this.levelContainer);

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
    });
    app.stage.on('pointerdown', (event) => {
      event.stopPropagation();
      this.startPrimaryAction();
    });
    app.stage.on('pointerup', (event) => {
      event.stopPropagation();
      this.endPrimaryAction();
    });

    // Add ticker
    this.app.ticker.add(this.updateScore, this, UPDATE_PRIORITY.LOW);

    // Add timer
    this.coinAnimationTimer = new Timer(100);
    this.coinAnimationTimer.loop = true;
    this.coinAnimationTimer.on('repeat', (elapsedTime, repeat) => {
      // Update tile animations
      this.app.renderer.plugins.tilemap.tileAnim[0] = repeat;
      this.app.renderer.plugins.tilemap.tileAnim[1] = repeat;
    });
    this.coinAnimationTimer.start();
  }

  startPrimaryAction() {
    this.actionPressed = true;

    if (this.primaryActionTimer != null) {
      return;
    }

    if (this.player.dead) {
      this.reset();
    } else if (!this.player.airborne) {
      console.debug('Start jump');
      this.player.jump();

      this.primaryActionTimer = new Timer(20);
      this.primaryActionTimer.repeat = 10;
      this.primaryActionTimer.on('repeat', (elapsedTime, repeat) => {
        // Add more jump velocity after the first 10ms for 110ms after pressing jump (decreasing over time)
        this.player.velocity.y += (this.player.power / repeat) * 1.1;
      });
      this.primaryActionTimer.start();
    }
  }

  endPrimaryAction() {
    this.actionPressed = false;

    if (this.primaryActionTimer != null) {
      console.debug('End jump');
      this.primaryActionTimer.stop();
      this.primaryActionTimer = null;
    }
  }

  startSecondaryAction() {
    if (this.secondaryActionTimer != null) {
      return;
    }

    console.debug('Start boost');
    this.player.boost();
    this.boostEmitter.emit = true;

    this.secondaryActionTimer = new Timer(500);
    this.secondaryActionTimer.on('end', () => {
      console.debug('End boost');
      this.boostEmitter.emit = false;
      this.player.velocity.x = this.player.lastVelocity.x;
      this.secondaryActionTimer = null;
    });
    this.secondaryActionTimer.start();
  }

  createCoke(x, y) {
    const cokeSprite = AnimatedSprite.fromFrames(['coke1.png', 'coke2.png']);
    cokeSprite.animationSpeed = 0.15;
    cokeSprite.position.x = x * this.tileWidth;
    cokeSprite.position.y = y * this.tileHeight;
    cokeSprite.play();
    this.cokes.push(cokeSprite);
    this.levelContainer.addChild(cokeSprite);
  }

  checkCollision() {
    // Calculate the tile indices around the player
    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
    const tilemapY = this.tilemap.pivot.y % this.app.screen.height;
    const tilemapXMin = Math.max(
      0,
      Math.floor((tilemapX + this.player.container.position.x) / this.tileWidth) - 1
    );
    const tilemapXMax = Math.min(
      tilemapXMin + Math.ceil(this.player.width / this.tileWidth) + 1,
      this.mapWidth
    );
    const tilemapYMin = Math.max(
      0,
      Math.floor((tilemapY + this.player.container.position.y) / this.tileHeight) - 1
    );
    const tilemapYMax = Math.min(
      tilemapYMin + Math.ceil(this.player.height / this.tileHeight) + 1,
      this.mapHeight
    );

    // Check for collisions
    let intersecting = false;
    let landing = false;
    let collecting = false;
    for (let y = tilemapYMin; y <= tilemapYMax; y++) {
      for (let x = tilemapXMin; x <= tilemapXMax; x++) {
        if (this.map[y][x].value !== Tile.void) {
          // Create tile rectangle with screen coordinates
          const tileRectangle = new Rectangle(
            x * this.tileWidth - (this.tilemap.pivot.x % this.app.screen.width),
            y * this.tileHeight - (this.tilemap.pivot.y % this.app.screen.height),
            this.tileWidth,
            this.tileHeight
          );

          // Is overlapping and player was previously above the tile?
          let intersectRect;
          if ((intersectRect = intersect(this.player.containerRectangle, tileRectangle))) {
            if (this.map[y][x].value === Tile.coin && intersectRect.height > 0) {
              collecting = true;
              this.setTile(x, y, Tile.void);
              this.score += 10;
            } else if (
              this.map[y][x].value === Tile.platform &&
              this.player.lastPosition.y + this.player.height <= tileRectangle.y
            ) {
              // Fix position and cancel falling
              intersecting = true;
              this.player.position.y = tileRectangle.y - this.player.height;
              this.player.velocity.y = 0;

              // Set vertical position of the player container
              this.player.container.position.y = this.player.position.y;

              // Check for landing
              if (this.player.airborne) {
                console.debug('Landed');
                landing = true;
                this.player.jumpTimer = null;
              }
              break;
            }
          }
        }
      }
    }
    this.player.airborne = !intersecting;

    if (collecting) {
      // Redraw tilemap
      this.createTilemap(false);
    }

    // Start jumping if just landed
    if (landing && this.actionPressed) {
      console.debug('Early jump');
      this.endPrimaryAction();
      this.startPrimaryAction(true);
    }
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      console.debug('Died');
      this.player.dead = true;
      this.boostEmitter.emit = false;

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
    // Background sprites
    this.background1Sprite = Sprite.from('bg_wakaland_1.png');

    this.background2aSprite = Sprite.from('bg_wakaland_2.png');
    this.background2aSprite.y = this.app.screen.height - 96;

    this.background2bSprite = Sprite.from('bg_wakaland_2.png');
    this.background2bSprite.x = this.background2bSprite.width;
    this.background2bSprite.y = this.app.screen.height - 96;

    this.background3aSprite = Sprite.from('bg_wakaland_3.png');
    this.background3aSprite.y = this.app.screen.height - 32;

    this.background3bSprite = Sprite.from('bg_wakaland_3.png');
    this.background3bSprite.x = this.background3bSprite.width;
    this.background3bSprite.y = this.app.screen.height - 32;

    this.tilemap = new CompositeTilemap();

    // Particle emitters
    this.boostEmitter = new Emitter(
      this.app.stage,
      upgradeConfig(boostEmitterConfig, [Sprite.from('particle.png').texture])
    );

    // Score text
    this.scoreText = new BitmapText('Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.scoreText.x = 2;

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
    this.mapWidth = Math.ceil(this.app.screen.width / this.tileWidth) * 2;
    this.mapHeight = Math.ceil(this.app.screen.height / this.tileHeight);

    for (let y = 0; y <= this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        this.setTile(x, y, y === this.startFloorY ? Tile.platform : Tile.void, random(0, 3));
      }
    }
  }

  createNewTiles() {
    // Check if we need to create new tiles
    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
    if (tilemapX < this.lastTilemapX) {
      // Move second half to the first
      for (let y = 0; y <= this.mapHeight; y++) {
        for (let x = this.mapWidth / 2; x <= this.mapWidth; x++) {
          this.setTile(x - this.mapWidth / 2, y, this.map[y][x].value, this.map[y][x].random);
          this.setTile(x, y, Tile.void);
        }
      }

      // Generate new tiles for the second half
      for (let x = this.mapWidth / 2 + 1; x <= this.mapWidth; x++) {
        // Generate new section if necessary
        if (this.platformX === 0) {
          this.abyssLength = random(3, 6);
          this.platformY = random(
            Math.min(
              this.maxFloorY,
              Math.max(this.minFloorY, this.platformY - 7 + this.abyssLength)
            ),
            this.maxFloorY
          );
          this.platformLength = random(2, 8);
          this.platformX = this.platformLength;
        }

        // Fill current section
        if (this.abyssLength > 0) {
          // Fill abyss
          this.setTile(x, this.platformY, Tile.void);
          this.abyssLength--;
        } else {
          // Fill coin
          if (
            this.platformLength >= 3 &&
            this.platformX < this.platformLength &&
            this.platformX - 1 > 0
          ) {
            this.setTile(x, this.platformY - 3, Tile.coin);
          }

          // Fill platform
          this.setTile(x, this.platformY, Tile.platform, random(0, 3));
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
        if (this.map[y][x].value === Tile.coin) {
          this.tilemap.tile('coin1.png', x * this.tileWidth, y * this.tileHeight).tileAnimX(12, 4);
        } else if (this.map[y][x].value === Tile.platform) {
          let tile = null;

          // Platform start
          if (x > 0 && this.map[y][x - 1].value === Tile.void) {
            tile = 'planks1.png';
          }

          // Platform end
          else if (x + 1 < this.map[y].length && this.map[y][x + 1].value === Tile.void) {
            tile = 'planks5.png';
          }

          // Platform
          else {
            if (this.map[y][x].random === 0) {
              tile = 'planks2.png';
            } else if (this.map[y][x].random === 1) {
              tile = 'planks4.png';
            } else {
              tile = 'planks3.png';
            }
          }

          this.tilemap.tile(tile, x * this.tileWidth, y * this.tileHeight);
        }
      }
    }
    if (resetPosition) {
      this.tilemap.position.set(0, 0);
      this.tilemap.pivot.set(0, 0);
    }
  }

  updateBackground(dt) {
    // Parallax scrolling
    this.background2aSprite.pivot.x += 0.2 * dt;
    if (this.background2aSprite.pivot.x >= this.app.screen.width) {
      this.background2aSprite.pivot.x = 0;
    }
    this.background2bSprite.pivot.x += 0.2 * dt;
    if (this.background2aSprite.pivot.x >= this.app.screen.width) {
      this.background2aSprite.pivot.x = 0;
    }
    this.background3aSprite.pivot.x += 0.25 * dt;
    if (this.background3aSprite.pivot.x >= this.app.screen.width) {
      this.background3aSprite.pivot.x = 0;
    }
    this.background3bSprite.pivot.x += 0.25 * dt;
    if (this.background3bSprite.pivot.x >= this.app.screen.width) {
      this.background3bSprite.pivot.x = 0;
    }
    this.tilemap.pivot.x = this.player.position.x;
  }

  updateSprites(dt) {
    // Update cokes
    this.cokes = this.cokes.filter((coke) => {
      coke.position.x -= this.player.position.x - this.player.lastPosition.x;
      if (coke.position.x + coke.width < 0) {
        this.levelContainer.removeChild(coke);
        return false;
      }
      return true;
    });

    // Update boost effect
    this.boostEmitter.spawnPos.x = this.player.container.position.x + this.player.width / 2;
    this.boostEmitter.spawnPos.y = this.player.container.position.y + this.player.height;
  }

  updateScore() {
    // Draw score
    this.scoreText.text = 'Score: ' + this.score;
  }

  setTile(x, y, value = Tile.void, random = null) {
    this.map[y][x] = { value, random };
  }

  tick(dt) {
    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    this.app.stats.begin();

    // Update timers
    this.coinAnimationTimer.timerManager.update(this.app.ticker.elapsedMS);
    if (this.player.jumpTimer !== null) {
      this.player.jumpTimer += dt;
    }
    if (this.player.boostTimer !== null) {
      this.player.boostTimer += dt;
    }

    this.createNewTiles();
    this.player.move(dt);
    this.checkCollision();
    this.updateSprites(dt);
    this.updateBackground(dt);
    this.checkGameOver();

    // End performance measurement
    this.app.stats.end();
  }

  reset() {
    this.cokes.forEach((coke) => this.levelContainer.removeChild(coke));
    this.cokes = [];

    this.score = 0;
    this.elapsed = 0.0;
    this.abyssLength = 0;
    this.platformY = this.startFloorY;
    this.platformLength = 0;
    this.lastTilemapX = 0;
    this.primaryActionTimer = null;
    this.actionPressed = false;

    this.player.force = new Point(0.001, this.gravity);
    this.player.velocity = new Point(2, 0);
    this.player.lastVelocity = this.player.velocity.clone();
    this.player.position = new Point(this.tileWidth * 2, 0);
    this.player.lastPosition = this.player.position.clone();
    this.player.container.position = this.player.position.clone();
    this.player.airborne = true;
    this.player.dead = false;
    this.player.jumpTimer = null;

    this.background2aSprite.pivot.x = 0;
    this.background3aSprite.pivot.x = 0;
    this.background2bSprite.pivot.x = 0;
    this.background3bSprite.pivot.x = 0;

    this.levelContainer.filters = null;
    this.container.removeChild(this.gameOver);
    this.boostEmitter.emit = false;

    this.createMap();
    this.createTilemap();
  }
}
