import { Container, Loader, Rectangle, UPDATE_PRIORITY } from 'pixi.js';

import { DEBUG } from './Utilities';
import Background from './Background';
import Player from './Player';
import Map from './Map';
import HUD from './HUD';
import InputManager from './InputManager';

import TitleOverlay from './overlays/TitleOverlay';
import CharacterOverlay from './overlays/CharacterOverlay';
import GameOverOverlay from './overlays/GameOverOverlay';
import LeaderboardOverlay from './overlays/LeaderboardOverlay';
import SettingsOverlay from './overlays/SettingsOverlay';

export default class Game {
  DEFAULT_DIFFICULTY = localStorage.getItem('DIFFICULTY') || 1;
  DEFAULT_MUSIC_VOLUME = localStorage.getItem('MUSIC_VOLUME') || 0.3;
  DEFAULT_EFFECTS_VOLUME = localStorage.getItem('EFFECTS_VOLUME') || 0.7;

  app;
  container;
  inputManager;

  // Sound
  bgMusic;
  boostSound;
  coinSound;
  jumpSound;
  powerupSound;

  // Properties
  paused = true;
  difficulty = this.DEFAULT_DIFFICULTY;
  score = 0;
  boosts = 0;

  // Objects
  background;
  map;
  player;
  hud;

  // Overlays
  characterOverlay;
  gameOverOverlay;
  leaderboardOverlay;
  settingsOverlay;
  titleOverlay;

  constructor(app) {
    this.app = app;
    this.inputManager = new InputManager(this);

    // Prepare sounds
    this.bgMusic = Loader.shared.resources.bgMusic.sound;
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.DEFAULT_MUSIC_VOLUME;
    this.bgMusic.play();
    this.boostSound = Loader.shared.resources.boostSound.sound;
    this.boostSound.volume = this.DEFAULT_EFFECTS_VOLUME;
    this.coinSound = Loader.shared.resources.coinSound.sound;
    this.coinSound.volume = this.DEFAULT_EFFECTS_VOLUME;
    this.jumpSound = Loader.shared.resources.jumpSound.sound;
    this.jumpSound.volume = this.DEFAULT_EFFECTS_VOLUME;
    this.powerupSound = Loader.shared.resources.powerupSound.sound;
    this.powerupSound.volume = this.DEFAULT_EFFECTS_VOLUME;

    // Create container
    this.container = new Container();
    this.container.filterArea = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.container);

    // Create layers
    this.background = new Background(this);
    this.container.addChild(this.background.container);

    this.map = new Map(this);
    this.container.addChild(this.map.container);

    this.player = new Player(this);
    this.container.addChild(this.player.container);

    this.hud = new HUD(this);
    this.container.addChild(this.hud.container);

    // Create overlays
    this.characterOverlay = new CharacterOverlay(this);
    this.gameOverOverlay = new GameOverOverlay(this);
    this.leaderboardOverlay = new LeaderboardOverlay(this);
    this.settingsOverlay = new SettingsOverlay(this);
    this.titleOverlay = new TitleOverlay(this);

    // Register event listeners
    this.inputManager.on('reset', ['r'], (event) => {
      this.reset();
    });
    this.inputManager.on('select', ['ArrowLeft', 'ArrowRight'], (event) => {
      if (this.paused && this.characterOverlay.showing) {
        this.characterOverlay.select(this.characterOverlay.selected + 1);
      }
    });
    this.inputManager.on('skip', ['s', 'pointer', ' ', 'Enter'], async (event) => {
      if (this.paused) {
        if (this.titleOverlay.showing && this.titleOverlay.skippable) {
          await this.titleOverlay.hide();
          this.characterOverlay.show();
        } else if (
          this.characterOverlay.showing &&
          this.characterOverlay.skippable &&
          event.type !== 'pointerdown'
        ) {
          this.characterOverlay.hide();
        }
      } else if (this.player.dead) {
        if (
          this.gameOverOverlay.showing &&
          this.gameOverOverlay.skippable &&
          event.type !== 'pointerdown'
        ) {
          await this.gameOverOverlay.hide();
          this.leaderboardOverlay.show();
        } else if (this.leaderboardOverlay.showing && this.leaderboardOverlay.skippable) {
          this.leaderboardOverlay.hide();
        }
      } else if (this.settingsOverlay.showing && this.settingsOverlay.skippable) {
        this.settingsOverlay.hide();
      }
    });
    this.inputManager.on(
      'jump',
      ['s', 'pointer', ' '],
      () => {
        if (!this.paused && !this.player.dead && !this.player.airborne) {
          this.player.startJump();
        }
      },
      () => {
        this.player.endJump();
      }
    );
    this.inputManager.on('boost', ['d', 'swipeup', 'Shift'], () => {
      if (this.boosts > 0) {
        this.increaseScore(50);
        this.increaseBoost(-1);
        this.player.startBoost();
      }
    });
    this.inputManager.on('settings', ['Escape'], () => {
      if (!this.paused && !this.player.dead && !this.settingsOverlay.showing) {
        this.player.dead = true;
        this.settingsOverlay.show();
      }
    });

    // Show title overlay
    this.titleOverlay.show();

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.gameOverOverlay.show();
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
    this.titleOverlay.update(dt);
    this.characterOverlay.update(dt);
    this.gameOverOverlay.update(dt);
    this.settingsOverlay.update(dt);
    this.leaderboardOverlay.update(dt);

    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    if (DEBUG) {
      this.app.stats.begin();
    }

    this.player.update(dt);
    this.map.update(dt);
    this.background.update(dt);

    let landing = false;
    this.map.checkCollision(
      // collectCoinCallback
      () => {
        this.coinSound.play();
        this.increaseScore(10);
      },
      // collectCokeCallback
      () => {
        this.powerupSound.play();
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
        if (landing && this.inputManager.pressed['jump']) {
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

  reset() {
    this.inputManager.reset();

    // Properties
    this.score = 0;
    this.boosts = 0;

    // Objects
    this.background.reset();
    this.map.reset();
    this.player.reset();
    this.hud.reset();
  }
}
