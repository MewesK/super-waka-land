import {
  Application,
  Loader,
  Spritesheet,
  settings,
  SCALE_MODES,
} from "pixi.js";
import Level from "./Level";
import Player from "./Player";

// Import ressources
import ratAtlas from "./images/atlas/rat.json";
import ratSprites from "./images/atlas/rat.png";

// Settings
settings.SCALE_MODE = SCALE_MODES.NEAREST;

const width = 256;
const height = 224;
const resolution = 3;
const backgroundColor = 0xffffde;

// Variables
let player;
let level;

//
// Create a Pixi application
//

const app = new Application({
  width,
  height,
  resolution,
  backgroundColor,
  antialias: false,
});

// Mount application
document.getElementById("app").appendChild(app.view);

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

    // Create player
    player = new Player(-3.0, 1.0);

    // Create level
    level = new Level(app, player);

    // Compose stage
    app.stage.interactive = true;
    app.stage.addChild(level.container);

    // Render the stage
    app.renderer.render(app.stage);

    // Start game loop
    console.log("Starting game loop");
    app.ticker.add((dt) => level.tick(dt));
  });
}
