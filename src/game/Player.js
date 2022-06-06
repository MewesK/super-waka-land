import { Timer } from 'eventemitter3-timer';
import { AnimatedSprite, Point, Sprite, Container } from 'pixi.js';

import BoostEffect from './effects/BoostEffect';

export default class Player {
  POWER = 1.5;
  MASS = 1.0;
  GRAVITY = 0.3;
  PULL = 0.001;
  VELOCITY = new Point(2, 0);
  MAX_VELOCITY = new Point(8, 8);
  BOOST_MULTIPLIER = new Point(6.0, -4.5);
  JUMP_MULTIPLIER = new Point(0.0, -3.0);
  JUMP_BOOST_MULTIPLIER = new Point(0.0, -0.9);

  game;
  container = new Container();

  // Properties
  force = new Point(0, 0);
  velocity = new Point(0, 0);
  lastVelocity = new Point(0, 0);
  preBoostVelocity = null;
  position = new Point(0, 0);
  lastPosition = new Point(0, 0);

  // State
  #dead = false;
  #airborne = true;

  // Timers
  jumpTimer;
  boostTimer;

  // Effects
  boostEffect;

  // Sprites
  ratIdleSprite;
  ratWalkSprite;
  ratRunSprite;
  ratJumpSprite;

  // Debug
  jumpHeight = 0;

  constructor(game) {
    this.game = game;

    // Effects
    this.boostEffect = new BoostEffect(this.game);

    // Sprites
    this.ratIdleSprite = Sprite.from('rat_idle');

    this.ratWalkSprite = AnimatedSprite.fromFrames(['rat_idle', 'rat_walk']);
    this.ratWalkSprite.animationSpeed = 0.1;
    this.ratWalkSprite.play();

    this.ratRunSprite = AnimatedSprite.fromFrames(['rat_idle', 'rat_run']);
    this.ratRunSprite.animationSpeed = 0.15;
    this.ratRunSprite.play();

    this.ratJumpSprite = Sprite.from('rat_jump');

    // Reset
    this.reset();
  }

  get width() {
    return this.container.getChildAt(0).width;
  }

  get height() {
    return this.container.getChildAt(0).height;
  }

  get airborne() {
    return this.#airborne;
  }

  set airborne(value) {
    if (this.#airborne === value) {
      return;
    }

    console.debug('Airborne: ', value);

    this.#airborne = value;

    // End jump
    if (!value) {
      this.endJump();
    }

    // Update sprite
    this.updateSprite();
  }

  get dead() {
    return this.#dead;
  }

  set dead(value) {
    if (this.#dead === value) {
      return;
    }

    console.debug('Dead: ', value);

    this.#dead = value;

    if (value) {
      this.boostEffect.stop();
      if (this.boostTimer !== null) {
        this.boostTimer.stop();
      }
      if (this.jumpTimer !== null) {
        this.jumpTimer.stop();
      }
    }
  }

  addVelocity(dx = null, dy = null, keepLast = false) {
    this.setVelocity(
      dx !== null ? this.velocity.x + dx : null,
      dy !== null ? this.velocity.y + dy : null,
      keepLast
    );
  }

  setVelocity(x = null, y = null, keepLast = false) {
    if (x === null && y === null) {
      return;
    }
    if (!keepLast) {
      this.lastVelocity = this.velocity.clone();
    }
    if (x !== null) {
      this.velocity.x = x;
    }
    if (y !== null) {
      this.velocity.y = y;
    }

    // Update sprite
    this.updateSprite();
  }

  addPosition(dx = null, dy = null, keepLast = false) {
    this.setPosition(
      dx !== null ? this.position.x + dx : null,
      dy !== null ? this.position.y + dy : null,
      keepLast
    );
  }

  setPosition(x = null, y = null, keepLast = false) {
    if (x === null && y === null) {
      return;
    }
    if (!keepLast) {
      this.lastPosition = this.position.clone();
    }
    if (x !== null) {
      this.position.x = x;
    }
    if (y !== null) {
      this.position.y = y;
    }

    // Set vertical position of the player container
    this.container.position.y = this.position.y;
  }

  update(dt) {
    if (this.dead) {
      return;
    }

    // Update timers
    this.boostTimer?.update(this.game.app.ticker.elapsedMS);
    this.jumpTimer?.update(this.game.app.ticker.elapsedMS);

    // Update boost effect
    this.boostEffect.update(dt);

    //
    // Physics
    //

    const newVelocity = this.velocity.clone();

    // Calculate horizontal velocity
    newVelocity.x += (this.force.x / this.MASS) * dt;

    // Cap horizontal velocity
    if (this.MAX_VELOCITY.x > 0 && Math.abs(newVelocity.x) > this.MAX_VELOCITY.x) {
      newVelocity.x = Math.sign(newVelocity.x) * this.MAX_VELOCITY.x;
    }

    // Calculate gravity only when airborne
    if (this.airborne) {
      // Calculate vertical velocity
      newVelocity.y += (this.force.y / this.MASS) * dt;

      // Cap vertical velocity
      if (this.MAX_VELOCITY.y > 0 && Math.abs(newVelocity.y) > this.MAX_VELOCITY.y) {
        newVelocity.y = Math.sign(newVelocity.y) * this.MAX_VELOCITY.y;
      }

      // Debug
      if (newVelocity.y < 0) {
        this.jumpHeight += newVelocity.y * dt;
      }
      if (this.lastVelocity.y < 0 && newVelocity.y >= 0) {
        console.debug('Max jump height: ', this.jumpHeight, this.lastVelocity.y);
      }
    }

    this.setVelocity(newVelocity.x, newVelocity.y);
    this.addPosition(newVelocity.x * dt, newVelocity.y * dt);
  }

  updateSprite() {
    if (this.#airborne) {
      if (
        this.container.children.length === 0 ||
        this.container.getChildAt(0) !== this.ratJumpSprite
      ) {
        this.container.removeChildren();
        this.container.addChild(this.ratJumpSprite);
      }
    } else if (this.velocity.x === 0) {
      if (
        this.container.children.length === 0 ||
        this.container.getChildAt(0) !== this.ratIdleSprite
      ) {
        this.container.removeChildren();
        this.container.addChild(this.ratIdleSprite);
      }
    } else if (this.velocity.x < 3) {
      if (
        this.container.children.length === 0 ||
        this.container.getChildAt(0) !== this.ratWalkSprite
      ) {
        this.container.removeChildren();
        this.container.addChild(this.ratWalkSprite);
      }
    } else if (this.velocity.x >= 3) {
      if (
        this.container.children.length === 0 ||
        this.container.getChildAt(0) !== this.ratRunSprite
      ) {
        this.container.removeChildren();
        this.container.addChild(this.ratRunSprite);
      }
    }
  }

  startJump() {
    if (this.dead || this.airborne || this.jumpTimer !== null) {
      return;
    }

    console.debug('Start jump');

    this.setVelocity(null, this.POWER * this.JUMP_MULTIPLIER.y);
    this.airborne = true;
    this.jumpHeight = 0; // Debug

    // Create jump timer
    this.jumpTimer = new Timer(20);
    this.jumpTimer.repeat = 13;
    this.jumpTimer.on('repeat', (elapsedTime, repeat) => {
      if (repeat <= 3) {
        return;
      }
      // Add more jump velocity after the first 10ms for 110ms after pressing jump (decreasing over time)
      const boostVelocityY = (this.POWER / (repeat - 3)) * this.JUMP_BOOST_MULTIPLIER.y;
      console.debug('Charge jump', repeat, boostVelocityY);
      this.addVelocity(null, boostVelocityY);
    });
    this.jumpTimer.start();
  }

  endJump() {
    if (this.jumpTimer === null) {
      return;
    }

    console.debug('End jump');

    this.jumpTimer.stop();
    this.jumpTimer = null;
  }

  startBoost() {
    if (this.dead || this.boostTimer !== null) {
      return;
    }

    console.debug('Start boost');

    this.preBoostVelocity = this.velocity.clone();
    this.setVelocity(this.POWER * this.BOOST_MULTIPLIER.x, this.POWER * this.BOOST_MULTIPLIER.y);
    this.boostEffect.start();

    // Create boost timer
    this.boostTimer = new Timer(500);
    this.boostTimer.on('end', () => {
      console.debug('End boost');
      // Reset horizontal velocity
      this.setVelocity(this.preBoostVelocity.x, null);
      this.preBoostVelocity = null;
      this.boostEffect.stop();
      this.boostTimer = null;
    });
    this.boostTimer.start();
  }

  reset() {
    // Properties
    this.force = new Point(this.PULL, this.GRAVITY);
    this.setVelocity(this.VELOCITY.x, this.VELOCITY.y);
    this.lastVelocity = this.velocity.clone();
    this.preBoostVelocity = null;
    this.setPosition(this.game.map.TILE_WIDTH * 2, 0);
    this.lastPosition = this.position.clone();

    // Set vertical position of the player container
    this.container.position.x = this.position.x;

    // State
    this.airborne = true;
    this.dead = false;

    // Timers
    this.jumpTimer = null;
    this.boostTimer = null;

    // Effects
    this.boostEffect.stop();
  }
}
