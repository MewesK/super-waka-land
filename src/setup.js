import { Application, Loader, settings, SCALE_MODES } from 'pixi.js';
import Stats from 'stats.js';
import '@pixi/sound';
import { getGPUTier } from 'detect-gpu';

import { CONTAINER, DEBUG } from './game/Utilities';
import Game from './game/Game';

// Debug
if (!DEBUG) {
  console.debug = () => {};
}

// Detect GPU
getGPUTier().then((tier) => {
  // Settings
  const WIDTH = 256;
  const HEIGHT = 224;
  const BACKGROUND_COLOR = 0xffffde;

  settings.SCALE_MODE = SCALE_MODES.NEAREST;
  settings.ROUND_PIXELS = tier.tier === 1;
  settings.RESOLUTION = { 1: 1, 2: 2, 3: 4 }[tier.tier];

  console.debug(`Detected a tier ${tier.tier} GPU. Setting internal resolution to ${settings.RESOLUTION}.`);

  // Create Pixi application
  const app = new Application({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    antialias: false,
  });
  CONTAINER.appendChild(app.view);

  if (DEBUG) {
    // Create FPS counter
    app.stats = new Stats();
    app.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    app.stats.dom.id = 'stats';
    CONTAINER.appendChild(app.stats.dom);
  }

  // Load resources
  Loader.shared.onProgress.add((loader, resource) => {
    console.debug('Loading: ' + resource.url);
    console.debug('Progress: ' + loader.progress + '%');
  });
  Loader.shared
    .add('spritesheet', './images/atlas.json')
    .add('editUndoFont', './fonts/edit-undo.fnt')
    .add('stopBullyingFont', './fonts/stop-bullying-outlined.fnt')
    .add('bgMusic', './sounds/bg-music1.mp3')
    .add('boostEffect', './sounds/boost.wav')
    .add('coinEffect', './sounds/coin.wav')
    .add('jumpEffect', './sounds/jump.wav')
    .add('powerupEffect', './sounds/powerup.wav')
    .add('sceneCharacter', './sounds/scene_character.mp3')
    .add('sceneGameOver', './sounds/scene_game_over.mp3')
    .add('voiceMama', './sounds/voice_mama.mp3')
    .add('voiceWao', './sounds/voice_wao.mp3')
    .add('voiceDeath', './sounds/voice_death.mp3')
    .add('voiceSelectTutel', './sounds/voice_select_tutel.mp3')
    .add('voiceSelectOrange', './sounds/voice_select_orange.mp3')
    .add('voiceSelectRaccoon', './sounds/voice_select_raccoon.mp3')
    .add('voiceSelectRat', './sounds/voice_select_rat.mp3')
    .load(() => {
      console.debug('All files loaded');

      // Create game
      const game = new Game(app);
      app.stage.interactive = true;
      app.renderer.render(app.stage);
    });
});
