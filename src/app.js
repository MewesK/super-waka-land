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
};

const player = {
  power: -7.0,
  mass: 1.0,
  force: new Point(0.001, world.gravity),
  velocity: new Point(2 , 0),
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
    groundTiles.tile("block.png", x * tileSizeX, world.startFloorY * tileSizeY);
  }
  groundTiles.position.set(player.position.x, groundTiles.position.y);
}

let oldX = player.position.x % resolutionX;
function gameLoop(dt) {
  const newX = player.position.x % resolutionX;
  if (newX < oldX) {
    drawTiles();
  }
  oldX = newX;

  // Check for collisions
  const buffer = groundTiles.children[0].pointsBuf;
  for (let i = 0; i < buffer.length; i += 14) {
    /*
    pb.push(u);
    pb.push(v);
    pb.push(x);
    pb.push(y);
    pb.push(tileWidth);
    pb.push(tileHeight);
    pb.push(rotate);
    pb.push(animX | 0);
    pb.push(animY | 0);
    pb.push(textureIndex);
    pb.push(animCountX);
    pb.push(animCountY);
    pb.push(animDivisor);
    pb.push(alpha);
    */
    const data = buffer.slice(i, i + 14);
    const rectangle = new Rectangle(data[2], data[3], data[4], data[5]);
    if (hitTestRectangle(ratRunSprite, rectangle)) {
      player.position.y = rectangle.y - 32;
      if (player.velocity.y > 0) {
        player.velocity.y = 0;
      }
    }
  }

  world.elapsed += dt;

  // Calculate velocity
  player.velocity.x += (player.force.x / player.mass) * dt;
  player.velocity.y += (player.force.y / player.mass) * dt;

  // Calculate position
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;

  ratRunSprite.position.set(ratRunSprite.position.x, player.position.y);
  groundTiles.pivot.set(player.position.x, groundTiles.pivot.y);
}

function jump() {
  player.velocity.y = player.power;
}

function hitTestRectangle(r1, r2) {
  // Define the variables we'll need to calculate
  let combinedHalfWidths, combinedHalfHeights, vx, vy;

  // Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  // Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  // Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  // Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  // Check for a collision on the x axis and y axis
  return (
    Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeights
  );
}
