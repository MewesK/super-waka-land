import { Application, Loader, Spritesheet, settings, SCALE_MODES, BitmapFont } from 'pixi.js';
import Stats from 'stats.js';
import Game from './game/Game';

// Import resources
import spritesAtlas from './assets/images/atlas.json';
import spritesImage from './assets/images/atlas.png';

import editUndoFontAtlas from 'bundle-text:./assets/fonts/edit-undo.fnt';
import editUndoFontImage from './assets/fonts/edit-undo.png';

import rainyHeartsFontAtlas from 'bundle-text:./assets/fonts/rainy-hearts.fnt';
import rainyHeartsFontImage from './assets/fonts/rainy-hearts.png';

import retroLandMayhemFontAtlas from 'bundle-text:./assets/fonts/retro-land-mayhem.fnt';
import retroLandMayhemFontImage from './assets/fonts/retro-land-mayhem.png';

import glutenFontAtlas from 'bundle-text:./assets/fonts/gluten.fnt';
import glutenFontImage from './assets/fonts/gluten.png';

import omBotakFontAtlas from 'bundle-text:./assets/fonts/om-botak.fnt';
import omBotakFontImage from './assets/fonts/om-botak.png';

import stopBullyingFontAtlas from 'bundle-text:./assets/fonts/stop-bullying.fnt';
import stopBullyingFontImage from './assets/fonts/stop-bullying.png';

// DEBUG
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
}

// Settings
settings.SCALE_MODE = SCALE_MODES.NEAREST;

const WIDTH = 256;
const HEIGHT = 224;
const RESOLUTION = 3;
const BACKGROUND_COLOR = 0xffffde;

//
// Create new Pixi application
//

const app = new Application({
  width: WIDTH,
  height: HEIGHT,
  resolution: RESOLUTION,
  backgroundColor: BACKGROUND_COLOR,
  antialias: false,
});
app.stats = new Stats();
app.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

// Mount application
document.getElementById('app').appendChild(app.view);
document.getElementById('app').appendChild(app.stats.dom);

// Load resources
Loader.shared.onProgress.add(loadProgressHandler);
Loader.shared
  .add(spritesImage)
  .add(editUndoFontImage)
  .add(rainyHeartsFontImage)
  .add(retroLandMayhemFontImage)
  .add(glutenFontImage)
  .add(omBotakFontImage)
  .add(stopBullyingFontImage)
  .load(setup);

function loadProgressHandler(loader, resource) {
  console.debug('Loading: ' + resource.url);
  console.debug('Progress: ' + loader.progress + '%');
}

function setup() {
  console.debug('All files loaded');

  // Load fonts
  BitmapFont.install(editUndoFontAtlas, Loader.shared.resources[editUndoFontImage].texture);
  BitmapFont.install(rainyHeartsFontAtlas, Loader.shared.resources[rainyHeartsFontImage].texture);
  BitmapFont.install(
    retroLandMayhemFontAtlas,
    Loader.shared.resources[retroLandMayhemFontImage].texture
  );
  BitmapFont.install(glutenFontAtlas, Loader.shared.resources[glutenFontImage].texture);
  BitmapFont.install(omBotakFontAtlas, Loader.shared.resources[omBotakFontImage].texture);
  BitmapFont.install(stopBullyingFontAtlas, Loader.shared.resources[stopBullyingFontImage].texture);

  // Load spritesheet
  const sheet = new Spritesheet(
    Loader.shared.resources[spritesImage].texture.baseTexture,
    spritesAtlas
  );
  sheet.parse(() => {
    console.debug('Spritesheet loaded');

    // Create new game
    const game = new Game(app);

    app.stage.interactive = true;
    app.stage.addChild(game.container);
    app.renderer.render(app.stage);
  });
}
