import {
  AnimatedSprite,
  Application,
  Loader,
  Point,
  Sprite,
  Spritesheet,
  settings,
  SCALE_MODES,
  Rectangle,
} from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";
import { hitTestRectangle, getRandomInt } from "./utilities";

// Import ressources
import ratAtlas from "./images/atlas/rat.json";
import ratSprites from "./images/atlas/rat.png";

// Settings
settings.SCALE_MODE = SCALE_MODES.NEAREST;

const resolutionX = 256;
const resolutionY = 224;
const tileSizeX = 16;
const tileSizeY = 16;
const numberOfTiles = parseInt(resolutionX / tileSizeX) * 2;

// Variables
const world = {
  elapsed: 0.0,
  gravity: 0.3,
  startFloorY: 12,
  minFloorY: 10,
  maxFloorY: 14,
  map: [[]],
};

const player = {
  dead: false,
  power: -7.0,
  mass: 1.0,
  force: new Point(0.001, world.gravity),
  velocity: new Point(2, 0),
  position: new Point(tileSizeX * 2, 0),
};

// Sprites
let backgroundSprite;
let coinSprite;
let ratWalkSprite;
let ratRunSprite;
let ratJumpSprite;
let groundTiles;

// Create a Pixi application
const app = new Application({
  width: resolutionX,
  height: resolutionY,
  antialias: false,
  resolution: 3,
  backgroundColor: 0xffffde,
});

// Mount application
document.getElementById("app").appendChild(app.view);

// Register event listeners
app.view.addEventListener("click", jump);
app.view.addEventListener("touchend", jump);

// Load ressources
Loader.shared.onProgress.add(loadProgressHandler);
Loader.shared.add(ratSprites).load(setup);

function loadProgressHandler(loader, resource) {
  console.log("Loading: " + resource.url);
  console.log("Progress: " + loader.progress + "%");
}

function setup() {
  console.log("All files loaded");

  // Load spritesheet
  const sheet = new Spritesheet(
    Loader.shared.resources[ratSprites].texture.baseTexture,
    ratAtlas
  );
  sheet.parse(() => {
    console.log("Spritesheet loaded");

    // Create sprites
    backgroundSprite = Sprite.from("bg_wakaland.png");

    coinSprite = AnimatedSprite.fromFrames([
      "coin1.png",
      "coin2.png",
      "coin3.png",
      "coin4.png",
    ]);
    coinSprite.animationSpeed = 0.15;
    coinSprite.x = 190;
    coinSprite.y = 127;
    coinSprite.play();

    ratWalkSprite = AnimatedSprite.fromFrames(["rat_idle.png", "rat_walk.png"]);
    ratWalkSprite.animationSpeed = 0.1;
    ratWalkSprite.x = player.position.x;
    ratWalkSprite.y = player.position.y;
    ratWalkSprite.play();

    ratRunSprite = AnimatedSprite.fromFrames(["rat_idle.png", "rat_run.png"]);
    ratRunSprite.animationSpeed = 0.15;
    ratRunSprite.x = player.position.x;
    ratRunSprite.y = player.position.y;
    ratRunSprite.play();

    ratJumpSprite = Sprite.from("rat_jump.png");
    ratJumpSprite.x = player.position.x;
    ratJumpSprite.y = player.position.y;

    // Create inital tilemap
    groundTiles = new CompositeTilemap(0, "block.png");
    for (var y = 0; y <= numberOfTiles / 2; y++) {
      world.map[y] = [];
      for (var x = 0; x <= numberOfTiles; x++) {
        if (y === world.startFloorY) {
          world.map[y][x] = "block.png";
          groundTiles.tile("block.png", x * tileSizeX, y * tileSizeY);
        } else {
          world.map[y][x] = null;
        }
      }
    }

    // Compose stage
    app.stage.addChild(backgroundSprite);
    app.stage.addChild(groundTiles);
    app.stage.addChild(ratRunSprite);

    // Render the stage
    app.renderer.render(app.stage);

    // Start game loop
    console.log("Starting game loop");
    app.ticker.add(gameLoop);
  });
}

let plattformY = 0;
let plattformLength = 0;
function createTiles() {
  for (var y = 0; y <= numberOfTiles / 2; y++) {
    // Move second half to the first
    for (var x = numberOfTiles / 2; x <= numberOfTiles; x++) {
      world.map[y][x - numberOfTiles / 2] = world.map[y][x];
      world.map[y][x] = null;
    }
  }

  // Generate new plattforms for the second half
  for (var x = numberOfTiles / 2 + 1; x <= numberOfTiles; x++) {
    if (plattformLength === 0) {
      plattformY = getRandomInt(world.minFloorY, world.maxFloorY);
      plattformLength = getRandomInt(2, 8);
    }
    world.map[plattformY][x] = "block.png";
    plattformLength--;
  }

  // Clear and refill tilemap
  groundTiles.clear();
  for (var y = 0; y <= numberOfTiles / 2; y++) {
    for (var x = 0; x <= numberOfTiles; x++) {
      if (world.map[y][x] !== null) {
        groundTiles.tile(world.map[y][x], x * tileSizeX, y * tileSizeY);
      }
    }
  }
  groundTiles.position.set(player.position.x, groundTiles.position.y);
}

let oldX = player.position.x % resolutionX;
function gameLoop(dt) {
  if (player.dead) {
    return;
  }

  const newX = player.position.x % resolutionX;
  if (newX < oldX) {
    createTiles();
  }
  oldX = newX;

  // Check for collisions
  const playerRectangle = new Rectangle(
    ratRunSprite.position.x,
    ratRunSprite.position.y + 24,
    16,
    8
  );
  for (var y = 0; y <= numberOfTiles / 2; y++) {
    for (var x = 0; x <= numberOfTiles; x++) {
      if (world.map[y][x] !== null) {
        const tileRectangle = new Rectangle(
          x * tileSizeX - (groundTiles.pivot.x % resolutionX),
          y * tileSizeY - (groundTiles.pivot.y % resolutionY),
          tileSizeX,
          tileSizeY / 2
        );
        if (hitTestRectangle(playerRectangle, tileRectangle)) {
          player.position.y = tileRectangle.y - 32;
          if (player.velocity.y > 0) {
            player.velocity.y = 0;
          }
        }
      }
    }
  }

  // Check for death
  if (player.position.y > resolutionY) {
    player.dead = true;
  }

  world.elapsed += dt;

  // Calculate velocity
  player.velocity.x += (player.force.x / player.mass) * dt;
  player.velocity.y += (player.force.y / player.mass) * dt;
  if (player.velocity.x > 10) {
    player.velocity.x = 10;
  }

  // Calculate position
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;

  ratRunSprite.position.set(ratRunSprite.position.x, player.position.y);
  groundTiles.pivot.set(player.position.x, groundTiles.pivot.y);
}

function jump() {
  player.velocity.y = player.power;
  player.position.y += player.power * 2;
}
