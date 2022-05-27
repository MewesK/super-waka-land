import {
  AnimatedSprite,
  Application,
  Loader,
  ObservablePoint,
  Point,
  Sprite,
  Spritesheet,
  Ticker,
  settings,
  SCALE_MODES,
} from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";

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
  gravity: 0.2,
  startFloorY: 12,
};

const player = {
  power: 5.0,
  mass: 1.0,
  force: new Point(0, world.gravity),
  velocity: new Point(3, 0),
  position: new Point(0, 0),
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

    // Create tilemap
    groundTiles = new CompositeTilemap(0, "block.png");
    drawTiles();

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

function drawTiles() {
  console.log("drawTiles");
  for (var x = 0; x <= numberOfTiles; x++) {
    groundTiles.addFrame(
      "block.png",
      x * tileSizeX,
      world.startFloorY * tileSizeY
    );
  }
  groundTiles.position.set(player.position.x, groundTiles.position.y);
}

function gameLoop(dt) {
  if (Math.floor(player.position.x % resolutionX) === 0) {
    drawTiles();
  }

  world.elapsed += dt;

  player.velocity.x += (player.force.x / player.mass) * dt;
  player.velocity.y += (player.force.y / player.mass) * dt;
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;

  ratRunSprite.position.set(ratRunSprite.position.x, player.position.y);
  groundTiles.pivot.set(player.position.x, groundTiles.pivot.y);
}

function jump() {
  player.velocity.y = -player.power;
}
