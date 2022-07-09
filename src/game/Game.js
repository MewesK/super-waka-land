import { Container, Rectangle, UPDATE_PRIORITY } from 'pixi.js';

import { DEBUG } from './Utilities';
import Background from './Background';
import Player from './Player';
import Map from './Map';
import HUD from './HUD';
import InputManager from './managers/InputManager';
import OverlayManager, { OverlayType } from './managers/OverlayManager';
import SoundManager, { MusicType, EffectType } from './managers/SoundManager';

export default class Game {
  DEFAULT_DIFFICULTY = localStorage.getItem('DIFFICULTY') || 1;
  DEFAULT_MUSIC_VOLUME = localStorage.getItem('MUSIC_VOLUME') || 50;
  DEFAULT_EFFECT_VOLUME = localStorage.getItem('EFFECT_VOLUME') || 60;
  DEFAULT_VOICE_VOLUME = localStorage.getItem('VOICE_VOLUME') || 60;

  app;
  container;

  // Rendering layers
  background;
  map;
  player;
  hud;

  // Managers
  inputManager;
  overlayManager;
  soundManager;

  // Properties
  started = false;
  paused = false;
  difficulty = this.DEFAULT_DIFFICULTY;

  score = 0;
  boosts = 0;

  constructor(app) {
    this.app = app;

    // Rendering layers
    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);
    this.hud = new HUD(this);

    // Managers
    this.overlayManager = new OverlayManager(this);
    this.inputManager = new InputManager(this);
    this.soundManager = new SoundManager(this);

    // Create container
    this.container = new Container();
    this.container.filterArea = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.container);
    this.container.addChild(this.background.container);
    this.container.addChild(this.map.container);
    this.container.addChild(this.player.container);
    this.container.addChild(this.hud.container);

    // Register event listeners
    this.registerEventHandlers();

    // Start background music
    this.soundManager.playMusic(MusicType.WAKALAKA);

    // Open title overlay
    this.overlayManager.open(OverlayType.TITLE);

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  registerEventHandlers() {
    // Jump
    this.inputManager.on({
      name: 'jump',
      keys: ['s', 'pointer', ' '],
      onDown: () => {
        if (this.started && !this.paused && !this.player.dead && !this.player.airborne) {
          this.player.startJump();
        }
      },
      onUp: () => {
        if (this.started && !this.paused && !this.player.dead && this.player.airborne) {
          this.player.endJump();
        }
      },
    });

    // Boost
    this.inputManager.on({
      name: 'boost',
      keys: ['d', 'swipeup', 'Shift'],
      onDown: () => {
        if (this.started && !this.paused && !this.player.dead && this.boosts > 0) {
          this.increaseScore(50);
          this.increaseBoost(-1);
          this.player.startBoost();
        }
      },
    });

    // Reset
    this.inputManager.on({
      name: 'reset',
      keys: ['r'],
      onUp: () => {
        if (!OverlayType.TITLE.opened && !OverlayType.CHARACTER_SELECT.opened) {
          this.reset();
        }
      },
    });

    // Settings/Pause
    this.inputManager.on({
      name: 'settings',
      keys: ['Escape'],
      onUp: () => {
        if (!OverlayType.SETTINGS.opened) {
          this.overlayManager.open(OverlayType.SETTINGS);
        } else {
          this.overlayManager.close();
        }
      },
    });
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.overlayManager.open(OverlayType.GAME_OVER);
    }
  }

  increaseBoost(value) {
    this.boosts += value;
    this.hud.updateBoost();
  }

  increaseScore(value) {
    this.score += value;
    this.hud.updateScore();
  }

  update(dt) {
    // Start performance measurement
    if (DEBUG) {
      this.app.stats.begin();
    }

    this.overlayManager.update(dt);

    if (this.player.dead || this.paused) {
      return;
    }

    this.player.update(dt);
    this.map.update(dt);
    this.background.update(dt);

    let landing = false;
    this.map.checkCollision(
      // collectCoinCallback
      () => {
        this.soundManager.playEffect(EffectType.COIN);
        this.increaseScore(10);
      },
      // collectCokeCallback
      () => {
        this.soundManager.playEffect(EffectType.POWER_UP);
        this.increaseScore(50);
        this.increaseBoost(1);
      },
      // intersectFloorCallback
      (tileRectangle) => {
        // Fix position and cancel falling
        this.player.setVelocity(null, 0, true);
        this.player.setPosition(null, tileRectangle.y - this.player.height, true);

        // Check for landing
        if (this.player.airborne) {
          console.debug('Landed');
          landing = true;
        }
      },
      // finishCallback
      (intersecting, touching) => {
        this.player.airborne = !intersecting && !touching;

        // Start jumping if just landed but still holding key
        if (landing && this.inputManager.isActive('jump')) {
          console.debug('Early jump');
          this.player.startJump();
        }
      }
    );
    this.checkGameOver();

    // End performance measurement
    if (DEBUG) {
      this.app.stats.end();
    }
  }

  show() {
    this.hud.settingsSprite.interactive = true;
  }

  hide() {
    this.hud.settingsSprite.interactive = false;
  }

  reset() {
    // Properties
    this.started = true;
    this.score = 0;
    this.boosts = 0;

    // Objects
    this.map.reset();
    this.player.reset();
    this.hud.reset();

    // Managers
    this.inputManager.reset();
    this.overlayManager.reset();

    this.show();
  }
}
