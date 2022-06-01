import {
  Application,
  Loader,
  Spritesheet,
  settings,
  SCALE_MODES,
  BitmapFont,
  UPDATE_PRIORITY,
} from "pixi.js";
import Level from "./Level";
import Player from "./Player";

// Import resources
import ratAtlas from "./images/atlas/rat.json";
import ratSprites from "./images/atlas/rat.png";

import editUndoFontAtlas from "bundle-text:./fonts/edit-undo.fnt";
import editUndoFontImage from "./fonts/edit-undo.png";

import rainyHeartsFontAtlas from "bundle-text:./fonts/rainy-hearts.fnt";
import rainyHeartsFontImage from "./fonts/rainy-hearts.png";

import retroLandMayhemFontAtlas from "bundle-text:./fonts/retro-land-mayhem.fnt";
import retroLandMayhemFontImage from "./fonts/retro-land-mayhem.png";

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

// Load resources
Loader.shared.onProgress.add(loadProgressHandler);
Loader.shared
  .add(ratSprites)
  .add(editUndoFontImage)
  .add(rainyHeartsFontImage)
  .add(retroLandMayhemFontImage)
  .load(setup);

function loadProgressHandler(loader, resource) {
  console.log("Loading: " + resource.url);
  console.log("Progress: " + loader.progress + "%");
}

function setup() {
  console.log("All files loaded");

  // Load fonts
  BitmapFont.install(
    editUndoFontAtlas,
    Loader.shared.resources[editUndoFontImage].texture
  );
  BitmapFont.install(
    rainyHeartsFontAtlas,
    Loader.shared.resources[rainyHeartsFontImage].texture
  );
  BitmapFont.install(
    retroLandMayhemFontAtlas,
    Loader.shared.resources[retroLandMayhemFontImage].texture
  );

  // Load spritesheet
  const sheet = new Spritesheet(
    Loader.shared.resources[ratSprites].texture.baseTexture,
    ratAtlas
  );
  sheet.parse(() => {
    console.log("Spritesheet loaded");

    // Create player
    player = new Player(-2.0, 1.0);

    // Create level
    level = new Level(app, player);

    // Compose stage
    app.stage.interactive = true;
    app.stage.addChild(level.container);

    // Render the stage
    app.renderer.render(app.stage);

    // Start game loop
    console.log("Starting game loop");
    app.ticker.add(level.tick, level, UPDATE_PRIORITY.HIGH);
  });
}
