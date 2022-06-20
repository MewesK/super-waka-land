import { Container, Loader, UPDATE_PRIORITY } from 'pixi.js';

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

export default class Game {
  app;
  container = new Container();
  inputManager;

  // Sound
  bgMusic;
  boostSound;
  coinSound;
  jumpSound;
  powerupSound;

  // Properties
  paused = true;
  score = 0;
  boosts = 0;

  // Objects
  background;
  map;
  player;
  hud;

  // Overlays
  gameOverOverlay;
  characterOverlay;
  leaderboardOverlay;
  titleOverlay;

  constructor(app) {
    this.app = app;
    this.inputManager = new InputManager(this);

    this.bgMusic = Loader.shared.resources.bgMusic.sound;
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.03;
    this.bgMusic.play();
    this.boostSound = Loader.shared.resources.boostSound.sound;
    this.boostSound.volume = 0.1;
    this.coinSound = Loader.shared.resources.coinSound.sound;
    this.coinSound.volume = 0.06;
    this.jumpSound = Loader.shared.resources.jumpSound.sound;
    this.jumpSound.volume = 0.05;
    this.powerupSound = Loader.shared.resources.powerupSound.sound;
    this.powerupSound.volume = 0.1;

    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);
    this.hud = new HUD(this);

    this.gameOverOverlay = new GameOverOverlay(this);
    this.characterOverlay = new CharacterOverlay(this);
    this.leaderboardOverlay = new LeaderboardOverlay(this);
    this.titleOverlay = new TitleOverlay(this);

    this.reset();

    // Compose stage
    this.container.addChild(this.background.container);
    this.container.addChild(this.map.container);
    this.container.addChild(this.player.container);
    this.container.addChild(this.hud.container);
    this.app.stage.addChild(this.container);

    this.titleOverlay.show();

    // Register event listeners
    this.inputManager.on(
      'jump',
      ['s', 'pointer', ' '],
      () => {
        if (this.paused) {
          if (this.titleOverlay.showing) {
            this.titleOverlay.hide();
            this.characterOverlay.show();
          } else if (this.characterOverlay.showing && this.characterOverlay.skippable) {
            this.paused = false;
            this.reset();
          }
        } else if (this.player.dead) {
          if (this.gameOverOverlay.showing && this.gameOverOverlay.skippable) {
            this.gameOverOverlay.hide();
            this.leaderboardOverlay.show();
          } else if (this.leaderboardOverlay.showing && this.leaderboardOverlay.skippable) {
            this.reset();
          }
        } else if (!this.player.airborne) {
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

    // Overlays
    this.titleOverlay.hide();
    this.characterOverlay.hide();
    this.gameOverOverlay.hide();
    this.leaderboardOverlay.hide();
  }
}
