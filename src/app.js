import { Application, Loader, Spritesheet, settings, SCALE_MODES, BitmapFont } from 'pixi.js';
import Stats from 'stats.js';
import Game from './game/Game';

// Import resources
import spritesAtlas from './assets/images/atlas.json';
import spritesImage from './assets/images/atlas.png';

import editUndoFontAtlas from 'bundle-text:./assets/fonts/edit-undo.fnt';
import editUndoFontImage from './assets/fonts/edit-undo.png';

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
// Create Pixi application
//

const app = new Application({
  width: WIDTH,
  height: HEIGHT,
  resolution: RESOLUTION,
  backgroundColor: BACKGROUND_COLOR,
  antialias: false,
});
document.getElementById('app').appendChild(app.view);

// Create FPS counter
if (process.env.NODE_ENV !== 'production') {
  app.stats = new Stats();
  app.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('app').appendChild(app.stats.dom);
}

// Load resources
Loader.shared.onProgress.add((loader, resource) => {
  console.debug('Loading: ' + resource.url);
  console.debug('Progress: ' + loader.progress + '%');
});
Loader.shared
  .add(spritesImage)
  .add(editUndoFontImage)
  .add(stopBullyingFontImage)
  .load(() => {
    console.debug('All files loaded');

    // Load fonts
    BitmapFont.install(editUndoFontAtlas, Loader.shared.resources[editUndoFontImage].texture);
    BitmapFont.install(
      stopBullyingFontAtlas,
      Loader.shared.resources[stopBullyingFontImage].texture
    );

    // Load spritesheet
    const sheet = new Spritesheet(
      Loader.shared.resources[spritesImage].texture.baseTexture,
      spritesAtlas
    );
    sheet.parse(() => {
      console.debug('Spritesheet loaded');

      // Create game
      const game = new Game(app);

      app.stage.interactive = true;
      app.stage.addChild(game.container);
      app.renderer.render(app.stage);
    });
  });
