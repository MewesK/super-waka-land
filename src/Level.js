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

export default class Level {
  app;
  player;
  coins = [];
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
  plattformX = 0;
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

  createCoin(x, y) {
    /*const coinSprite = AnimatedSprite.fromFrames([
      'coin1.png',
      'coin2.png',
      'coin3.png',
      'coin4.png',
    ]);
    coinSprite.animationSpeed = 0.15;
    coinSprite.position.x = x * this.tileWidth;
    coinSprite.position.y = y * this.tileHeight;
    coinSprite.play();
    this.coins.push(coinSprite);
    this.levelContainer.addChild(coinSprite);*/

    this.map[y][x] = 'coin1.png';
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

      this.gameOverText2.text = 'Final Score: ' + Math.floor(this.player.position.x);
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
        this.setTile(x, y, y === this.startFloorY, x === this.mapWidth);
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
      let firstTile = false;
      for (let x = this.mapWidth / 2 + 1; x <= this.mapWidth; x++) {
        // Generate new section if necessary
        if (this.plattformX === 0) {
          this.abyssLength = random(3, 6);
          this.plattformY = random(
            Math.min(
              this.maxFloorY,
              Math.max(this.minFloorY, this.plattformY - 7 + this.abyssLength)
            ),
            this.maxFloorY
          );
          this.plattformLength = random(2, 8);
          this.plattformX = this.plattformLength;
          firstTile = true;
        }

        // Fill current section
        if (this.abyssLength > 0) {
          // Fill abyss
          this.setTile(x, this.plattformY, false);
          this.abyssLength--;
        } else {
          if (this.plattformLength >= 3 && !firstTile && this.plattformX - 1 > 0) {
            this.createCoin(x, this.plattformY - 3);
          }
          firstTile = false;

          // Fill platform
          this.setTile(x, this.plattformY, true, this.plattformX - 1 === 0);
          this.plattformX--;
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

  updateSprites(dt) {
    // Update coins
    this.coins = this.coins.filter((coin) => {
      coin.position.x -= this.player.position.x - this.player.lastPosition.x;
      if (coin.position.x + coin.width < 0) {
        this.levelContainer.removeChild(coin);
        return false;
      }
      return true;
    });

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
    this.scoreText.text = 'Score: ' + Math.floor(this.player.position.x).toFixed(0);
  }

  setTile(x, y, value = true, last = false) {
    // Empty
    if (!value) {
      this.map[y][x] = null;
    }

    // Platform start
    else if (x > 0 && this.map[y][x - 1] === null) {
      this.map[y][x] = 'planks1.png';
    }

    // Platform end
    else if (last) {
      this.map[y][x] = 'planks5.png';
    }

    // Platform
    else {
      const randomTile = random(0, 3);
      if (randomTile === 0) {
        this.map[y][x] = 'planks2.png';
        if (x > 0 && this.map[y][x - 1] !== 'planks3.png') {
          this.map[y][x] = 'planks3.png';
        }
      } else if (randomTile === 1) {
        this.map[y][x] = 'planks4.png';
        if (x > 0 && this.map[y][x - 1] !== 'planks3.png') {
          this.map[y][x] = 'planks3.png';
        }
      } else {
        this.map[y][x] = 'planks3.png';
      }
    }
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
    this.updateSprites(dt);
    this.updateBackground(dt);
    this.checkGameOver();

    // End performance measurement
    this.app.stats.end();
  }

  reset() {
    this.coins.forEach((coin) => this.levelContainer.removeChild(coin));
    this.coins = [];
    this.cokes.forEach((coke) => this.levelContainer.removeChild(coke));
    this.cokes = [];

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
    this.boostEmitter.emit = false;

    this.createMap();
    this.createTilemap();
  }
}
