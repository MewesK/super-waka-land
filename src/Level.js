import { AnimatedSprite, Point, Sprite, Container, Rectangle } from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";
import { intersect, random } from "./utilities";

export default class Level {
  app;
  player;
  map = [[]];
  container = new Container();

  // Properties
  gravity = 0.3;
  elapsed = 0.0;

  // Constants
  startFloorY = 12;
  minFloorY = 8;
  maxFloorY = 13;

  // Sprites
  tileWidth = 16;
  tileHeight = 16;
  backgroundSprite;
  coinSprite;
  tilemap;

  // Temp
  abyssLength = 0;
  plattformY = this.startFloorY;
  plattformLength = 0;
  lastTilemapX = 0;

  constructor(app, player) {
    this.app = app;
    this.player = player;

    this.createSprites();
    this.reset();

    // Compose stage
    this.container.addChild(this.backgroundSprite);
    this.container.addChild(this.tilemap);
    this.container.addChild(this.player.container);

    // Register event listeners
    app.view.addEventListener("click", () => this.click());
    app.view.addEventListener("touchend", () => this.click());
  }

  click() {
    if (this.player.dead) {
      this.reset();
    } else {
      this.player.jump();
    }
  }

  createSprites() {
    this.backgroundSprite = Sprite.from("bg_wakaland.png");

    this.coinSprite = AnimatedSprite.fromFrames([
      "coin1.png",
      "coin2.png",
      "coin3.png",
      "coin4.png",
    ]);
    this.coinSprite.animationSpeed = 0.15;
    this.coinSprite.x = 190;
    this.coinSprite.y = 127;
    this.coinSprite.play();

    this.tilemap = new CompositeTilemap(0, "block.png");
  }

  createMap() {
    this.mapWidth = parseInt(this.app.screen.width / this.tileWidth) * 2;
    this.mapHeight = parseInt(this.app.screen.height / this.tileHeight);

    for (let y = 0; y <= this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x <= this.mapWidth * 2; x++) {
        if (y === this.startFloorY) {
          this.map[y][x] = "block.png";
        } else {
          this.map[y][x] = null;
        }
      }
    }
  }

  createNewTiles() {
    for (let y = 0; y <= this.mapHeight; y++) {
      // Move second half to the first
      for (var x = this.mapWidth / 2; x <= this.mapWidth; x++) {
        this.map[y][x - this.mapWidth / 2] = this.map[y][x];
        this.map[y][x] = null;
      }
    }

    // Generate new plattforms for the second half
    for (let x = this.mapWidth / 2 + 1; x <= this.mapWidth; x++) {
      // Generate new section
      if (this.plattformLength === 0) {
        this.abyssLength = random(2, 6);
        this.plattformY = random(
          this.minFloorY,
          this.plattformY + 4 - this.abyssLength
        );
        this.plattformLength = random(2, 8);
      }
      if (this.abyssLength > 0) {
        // Abyss tile
        this.abyssLength--;
      } else {
        // Plattform tile
        this.map[this.plattformY][x] = "block.png";
        this.plattformLength--;
      }
    }

    // Redraw tilemap
    this.createTilemap();

    // Reset tilemap position
    this.tilemap.position.set(this.player.position.x, this.tilemap.position.y);
  }

  createTilemap() {
    this.tilemap.clear();
    for (var y = 0; y <= this.mapHeight; y++) {
      for (var x = 0; x <= this.mapWidth * 2; x++) {
        if (this.map[y][x] !== null) {
          this.tilemap.tile(
            this.map[y][x],
            x * this.tileWidth,
            y * this.tileHeight
          );
        }
      }
    }
    this.tilemap.position.set(0, 0);
    this.tilemap.pivot.set(0, 0);
  }

  tick(dt) {
    if (this.player.dead) {
      return;
    }

    this.elapsed += dt;

    // Check if we need to create new tiles
    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
    if (tilemapX < this.lastTilemapX) {
      this.createNewTiles();
    }
    this.lastTilemapX = tilemapX;

    // Move player
    this.player.move(dt);

    // Check for collisions
    let intersecting = false;
    for (var y = 0; y <= this.mapHeight; y++) {
      for (var x = 0; x <= this.mapWidth; x++) {
        if (this.map[y][x] !== null) {
          const tileRectangle = new Rectangle(
            x * this.tileWidth - (this.tilemap.pivot.x % this.app.screen.width),
            y * this.tileHeight -
              (this.tilemap.pivot.y % this.app.screen.height),
            this.tileWidth,
            this.tileHeight / 2
          );
          if (intersect(this.player.containerRectangle, tileRectangle)) {
            intersecting = true;
            this.player.position.y = tileRectangle.y - 32;
            if (this.player.velocity.y > 0) {
              this.player.velocity.y = 0;
            }
            break;
          }
        }
      }
      if (intersecting) {
        break;
      }
    }
    this.player.airborne = !intersecting;

    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      console.log("Player died");
      this.player.dead = true;
    }

    this.tilemap.pivot.set(this.player.position.x, this.tilemap.pivot.y);
  }

  reset() {
    this.elapsed = 0.0;
    this.abyssLength = 0;
    this.plattformY = this.startFloorY;
    this.plattformLength = 0;
    this.lastTilemapX = 0;

    this.player.force = new Point(0.001, this.gravity);
    this.player.velocity = new Point(2, 0);
    this.player.position = new Point(this.tileWidth * 2, 0);
    this.player.container.position.x = this.player.position.x;
    this.player.airborne = true;
    this.player.dead = false;

    this.createMap();
    this.createTilemap();
  }
}