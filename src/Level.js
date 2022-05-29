import { AnimatedSprite, Point, Sprite, Container, Rectangle } from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";
import { intersect, intersect, random } from "./utilities";

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
  minFloorY = 5;
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
  actionTimer = null;

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
    window.addEventListener("keydown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === "Space") {
        this.startAction();
      }
    });
    window.addEventListener("keyup", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.endAction();
    });
    app.stage.on("pointerdown", (event) => {
      event.stopPropagation();
      this.startAction();
    });
    app.stage.on("pointerup", (event) => {
      event.stopPropagation();
      this.endAction();
    });
  }

  startAction() {
    if (this.player.dead) {
      this.reset();
    } else {
      if (!this.player.airborne) {
        this.actionTimer = 0;
        this.player.jump();
      }
    }
  }

  endAction() {
    this.actionTimer = null;
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
    this.mapWidth = Math.ceil(this.app.screen.width / this.tileWidth) * 2;
    this.mapHeight = Math.ceil(this.app.screen.height / this.tileHeight);

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
        // Fill plattform
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
    if (this.actionTimer !== null) {
      this.actionTimer += dt;
      if (this.actionTimer >= 10) {
        this.actionTimer = null;
      }
    }

    const tilemapX = this.tilemap.pivot.x % this.app.screen.width;
    const tilemapY = this.tilemap.pivot.y % this.app.screen.height;
    const lastPlayerY = this.player.position.y;

    // Check if we need to create new tiles
    if (tilemapX < this.lastTilemapX) {
      this.createNewTiles();
    }
    this.lastTilemapX = tilemapX;

    // Move player
    this.player.move(dt);
    if (this.actionTimer > null) {
      // Add more jump velocity for the first 100ms after pressing jump (based on player power but decreasing over time)
      this.player.velocity.y += (this.player.power + this.actionTimer / 4) / 6;
      // TODO: start jumping if just landed
    }

    // Draw score (TODO)
    document.getElementById("score-value").innerHTML = Math.floor(
      this.player.position.x
    );

    // Calculate the tile indieces around the player
    const mapTileXMin = Math.max(
      0,
      Math.floor(
        (tilemapX + this.player.container.position.x) / this.tileWidth
      ) - 1
    );
    const mapTileXMax = Math.min(mapTileXMin + 2, this.mapWidth);
    const mapTileYMin = Math.max(
      0,
      Math.floor(
        (tilemapY + this.player.container.position.y) / this.tileHeight
      ) - 1
    );
    const mapTileYMax = Math.min(mapTileYMin + 3, this.mapHeight);

    // Check for collisions
    let intersecting = false;
    for (var y = mapTileYMin; y <= mapTileYMax; y++) {
      for (var x = mapTileXMin; x <= mapTileXMax; x++) {
        if (this.map[y][x] !== null) {
          // Create tile rectangle with screen coordinates
          const tileRectangle = new Rectangle(
            x * this.tileWidth - (this.tilemap.pivot.x % this.app.screen.width),
            y * this.tileHeight -
              (this.tilemap.pivot.y % this.app.screen.height),
            this.tileWidth,
            this.tileHeight
          );
          // Is overlaping and player was previously above the tile?
          if (
            intersect(this.player.containerRectangle, tileRectangle) &&
            lastPlayerY + 32 <= tileRectangle.y
          ) {
            intersecting = true;
            // Fix position
            this.player.position.y = tileRectangle.y - 32;
            // Cancel falling
            if (this.player.velocity.y > 0) {
              this.player.velocity.y = 0;
            }
          }
        }
      }
    }
    this.player.airborne = !intersecting;

    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      console.log("Player died");
      this.player.dead = true;
    }

    // TODO: Add paralax scrolling
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
