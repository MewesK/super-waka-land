import * as PIXI from "pixi.js";

// Import ressources
import ratAtlas from "./images/atlas/rat.json";
import ratAtlasImage from "./images/atlas/rat.png";

// Define aliases
const loader = PIXI.Loader.shared;

// Settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// Create a Pixi application
const app = new PIXI.Application({
  width: 256,
  height: 224,
  antialias: false,
  resolution: 2,
});
app.renderer.backgroundColor = 0x061639;

// Mount application
document.getElementById("app").appendChild(app.view);

// Load ressources
loader.onProgress.add(loadProgressHandler);
loader.add("ratAtlasImage", ratAtlasImage).load(setup);

function loadProgressHandler(loader, resource) {
  console.log("Loading: " + resource.url);
  console.log("Progress: " + loader.progress + "%");
}

function setup() {
  console.log("All files loaded");

  // Load spritesheet
  const texture = loader.resources["ratAtlasImage"].texture.baseTexture;
  const sheet = new PIXI.Spritesheet(texture, ratAtlas);
  sheet.parse(() => {
    const backgroundSprite = PIXI.Sprite.from("bg_wakaland.png"); 
      
    const ratWalkSprite = PIXI.AnimatedSprite.fromFrames([
      "rat_idle.png",
      "rat_walk.png",
    ]);
    ratWalkSprite.animationSpeed = 0.1;
    ratWalkSprite.x = 142;
    ratWalkSprite.y = 133;
    ratWalkSprite.play();

    const ratRunSprite = PIXI.AnimatedSprite.fromFrames([
      "rat_idle.png",
      "rat_run.png",
    ]);
    ratRunSprite.animationSpeed = 0.15;
    ratRunSprite.x = 190;
    ratRunSprite.y = 127;
    ratRunSprite.play();

    const ratJumpSprite = PIXI.Sprite.from("rat_jump.png");

    // Add the rocket to the stage
    app.stage.addChild(backgroundSprite);
    app.stage.addChild(ratWalkSprite);
    app.stage.addChild(ratRunSprite);
    //app.stage.addChild(ratJumpSprite);

    // Render the stage
    app.renderer.render(app.stage);
  });
}
