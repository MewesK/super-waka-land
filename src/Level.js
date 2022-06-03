import {
  AnimatedSprite,
  Loader,
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

import emitterConfig from './emitter.json';

import dotParticle from './images/dotParticle.png';
import fireParticle from './images/fireParticle.png';

export default class Level {
  app;
  player;
  map = [[]];
  container = new Container();
  levelContainer = new Container();

  // Properties
  gravity = 0.3;
  startFloorY = 12;
  minFloorY = 5;
  maxFloorY = 13;

  // Sprites
  tileWidth = 16;
  tileHeight = 16;

  background1Sprite;
  background2aSprite;
  background2bSprite;
  background3aSprite;
  background3bSprite;
  coinSprite;
  tilemap;
  scoreText;

  gameOver = new Container();
  gameOverText1;
  gameOverText2;

  emitter;

  // Temp
  abyssLength = 0;
  plattformY = this.startFloorY;
  plattformLength = 0;
  lastTilemapX = 0;

  primaryActionTimer = null;
  secondaryActionTimer = null;
  actionPressed = false;

  constructor(app, player) {
    this.app = app;
    this.player = player;

    this.createSprites();
    this.emitter = new Emitter(
      this.app.stage,
      upgradeConfig(emitterConfig, [
        Loader.shared.resources[dotParticle].texture,
      ])
    );
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
      if (event.code === 'Space') {
        event.preventDefault();
        event.stopPropagation();
        this.startPrimaryAction();
      }
      if (event.code === 'AltLeft') {
        event.preventDefault();
        event.stopPropagation();
        this.startSecondaryAction();
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
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
    this.emitter.emit = true;

    this.secondaryActionTimer = new Timer(500);
    this.secondaryActionTimer.on('end', () => {
      console.debug('End boost');
      this.emitter.emit = false;
      this.player.velocity.x = this.player.lastVelocity.x;
      this.secondaryActionTimer = null;
    });
    this.secondaryActionTimer.start();
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
    for (let y = tilemapYMin; y <= tilemapYMax; y++) {
      for (let x = tilemapXMin; x <= tilemapXMax; x++) {
        if (this.map[y][x] !== null) {
          // Create tile rectangle with screen coordinates
          const tileRectangle = new Rectangle(
            x * this.tileWidth - (this.tilemap.pivot.x % this.app.screen.width),
            y * this.tileHeight - (this.tilemap.pivot.y % this.app.screen.height),
            this.tileWidth,
            this.tileHeight
          );

          // Is overlapping and player was previously above the tile?
          if (
            intersect(this.player.containerRectangle, tileRectangle) &&
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
    this.player.airborne = !intersecting;

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
      this.emitter.emit = false;

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

      this.gameOverText2.text = 'Final Score: ' + Math.floor(this.player.position.x);
      this.gameOverText2.x = this.app.screen.width / 2 - this.gameOverText2.width / 2;

      this.container.addChild(this.gameOver);
    }
  }

  createSprites() {
    this.background1Sprite = Sprite.from('bg_wakaland_1.png');
    this.background2aSprite = Sprite.from('bg_wakaland_2.png');
    this.background3aSprite = Sprite.from('bg_wakaland_3.png');
    this.background2bSprite = Sprite.from('bg_wakaland_2.png');
    this.background2bSprite.x = this.background2bSprite.width;
    this.background3bSprite = Sprite.from('bg_wakaland_3.png');
    this.background3bSprite.x = this.background3bSprite.width;

    this.coinSprite = AnimatedSprite.fromFrames([
      'coin1.png',
      'coin2.png',
      'coin3.png',
      'coin4.png',
    ]);
    this.coinSprite.animationSpeed = 0.15;
    this.coinSprite.x = 190;
    this.coinSprite.y = 127;
    this.coinSprite.play();

    this.tilemap = new CompositeTilemap();

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
        if (y === this.startFloorY) {
          this.map[y][x] = 'block.png';
        } else {
          this.map[y][x] = null;
        }
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
          this.map[y][x - this.mapWidth / 2] = this.map[y][x];
          this.map[y][x] = null;
        }
      }

      // Generate new tiles for the second half
      for (let x = this.mapWidth / 2 + 1; x <= this.mapWidth; x++) {
        // Generate new section if necessary
        if (this.plattformLength === 0) {
          this.abyssLength = random(3, 6);
          this.plattformY = random(
            Math.min(
              this.maxFloorY,
              Math.max(this.minFloorY, this.plattformY - 7 + this.abyssLength)
            ),
            this.maxFloorY
          );
          this.plattformLength = random(2, 8);
        }
        // Fill current section
        if (this.abyssLength > 0) {
          // Fill abyss
          this.abyssLength--;
        } else {
          // Fill platform
          this.map[this.plattformY][x] = 'block.png';
          this.plattformLength--;
        }
      }

      // Redraw tilemap
      this.createTilemap();

      // Reset tilemap position
      this.tilemap.position.set(this.player.position.x, this.tilemap.position.y);
    }
    this.lastTilemapX = tilemapX;
  }

  createTilemap() {
    this.tilemap.clear();
    for (let y = 0; y <= this.mapHeight; y++) {
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        if (this.map[y][x] !== null) {
          this.tilemap.tile(this.map[y][x], x * this.tileWidth, y * this.tileHeight);
        }
      }
    }
    this.tilemap.position.set(0, 0);
    this.tilemap.pivot.set(0, 0);
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

  updateScore() {
    // Draw score
    this.scoreText.text = 'Score: ' + Math.floor(this.player.position.x).toFixed(0);
  }

  tick(dt) {
    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    this.app.stats.begin();

    // Update timers
    if (this.primaryActionTimer) {
      this.primaryActionTimer.timerManager.update(this.app.ticker.elapsedMS);
    }
    if (this.secondaryActionTimer) {
      this.secondaryActionTimer.timerManager.update(this.app.ticker.elapsedMS);
    }
    if (this.player.jumpTimer !== null) {
      this.player.jumpTimer += dt;
    }
    if (this.player.boostTimer !== null) {
      this.player.boostTimer += dt;
    }

    this.createNewTiles();
    this.player.move(dt);
    this.checkCollision();
    this.emitter.spawnPos.x = this.player.container.position.x + this.player.width;
    this.emitter.spawnPos.y = this.player.container.position.y + this.player.height;
    this.checkGameOver();
    this.updateBackground(dt);

    // End performance measurement
    this.app.stats.end();
  }

  reset() {
    this.elapsed = 0.0;
    this.abyssLength = 0;
    this.plattformY = this.startFloorY;
    this.plattformLength = 0;
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
    this.emitter.emit = false;

    this.createMap();
    this.createTilemap();
  }
}
