import { Application, Loader, settings, SCALE_MODES } from 'pixi.js';
import Stats from 'stats.js';
import '@pixi/sound';
import { getGPUTier } from 'detect-gpu';

import { DEBUG } from './game/Utilities';
import Game from './game/Game';

// Debug
if (DEBUG !== 'log') {
  console.log = () => {};
  console.debug = () => {};
}

// Settings
const WIDTH = 256;
const HEIGHT = 224;
const BACKGROUND_COLOR = 0xffffde;

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = false;

// Create Pixi application
const app = new Application({
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: BACKGROUND_COLOR,
  antialias: false,
});
document.getElementById('app').appendChild(app.view);

if (DEBUG) {
  // Create FPS counter
  app.stats = new Stats();
  app.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('app').appendChild(app.stats.dom);
}

// Detect GPU and increase resolution
getGPUTier().then((tier) => {
  settings.RESOLUTION = { 1: 1, 2: 5, 3: 10 }[tier.tier];
  if (DEBUG) {
    console.debug(`Detected a tier ${tier.tier} GPU. Setting resolution to ${settings.RESOLUTION}.`);
  }
});

// Load resources
Loader.shared.onProgress.add((loader, resource) => {
  console.debug('Loading: ' + resource.url);
  console.debug('Progress: ' + loader.progress + '%');
});
Loader.shared
  .add('spritesheet', './images/atlas.json')
  .add('editUndoFont', './fonts/edit-undo.fnt')
  .add('stopBullyingFont', './fonts/stop-bullying.fnt')
  .add('bgMusic', './sounds/bg-music1.mp3')
  .add('boostSound', './sounds/boost.wav')
  .add('coinSound', './sounds/coin.wav')
  .add('jumpSound', './sounds/jump.wav')
  .add('powerupSound', './sounds/powerup.wav')
  .load(() => {
    console.debug('All files loaded');

    // Create game
    const game = new Game(app);
    app.stage.interactive = true;
    app.renderer.render(app.stage);
  });
