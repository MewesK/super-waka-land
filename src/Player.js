import { AnimatedSprite, Point, Sprite, Rectangle, Container } from 'pixi.js';

export default class Player {
  container = new Container();

  // Properties
  force = new Point(0, 0);
  velocity = new Point(0, 0);
  lastVelocity = new Point(0, 0);
  maxVelocity = new Point(8, 8);
  position = new Point(0, 0);
  lastPosition = new Point(0, 0);
  power;
  mass;

  // State
  dead = false;
  jumpTimer = null;
  boostTimer = null;
  #airborne = true;

  // Sprites
  width = 25;
  height = 32;
  ratIdleSprite;
  ratWalkSprite;
  ratRunSprite;
  ratJumpSprite;

  // Debug
  jumpHeight = 0;

  constructor(power, mass) {
    this.power = power;
    this.mass = mass;

    this.createSprites();

    // Compose stage
    this.container.addChild(this.ratRunSprite);
  }

  get containerRectangle() {
    return new Rectangle(
      this.container.position.x,
      this.container.position.y,
      this.width,
      this.height
    );
  }

  get airborne() {
    return this.#airborne;
  }

  set airborne(value) {
    if (this.#airborne !== value) {
      // Debug
      console.debug('Aairborne: ', value);

      this.#airborne = value;

      if (value) {
        this.container.removeChildren();
        this.container.addChild(this.ratJumpSprite);
      } else {
        if (this.velocity.x === 0) {
          this.container.removeChildren();
          this.container.addChild(this.ratIdleSprite);
        } else if (this.velocity.x < 3) {
          this.container.removeChildren();
          this.container.addChild(this.ratWalkSprite);
        } else {
          this.container.removeChildren();
          this.container.addChild(this.ratRunSprite);
        }
      }
    }
  }

  createSprites() {
    this.ratIdleSprite = Sprite.from('rat_jump.png');
    this.ratIdleSprite.x = this.position.x;
    this.ratIdleSprite.y = this.position.y;

    this.ratWalkSprite = AnimatedSprite.fromFrames(['rat_idle.png', 'rat_walk.png']);
    this.ratWalkSprite.animationSpeed = 0.1;
    this.ratWalkSprite.x = this.position.x;
    this.ratWalkSprite.y = this.position.y;
    this.ratWalkSprite.play();

    this.ratRunSprite = AnimatedSprite.fromFrames(['rat_idle.png', 'rat_run.png']);
    this.ratRunSprite.animationSpeed = 0.15;
    this.ratRunSprite.x = this.position.x;
    this.ratRunSprite.y = this.position.y;
    this.ratRunSprite.play();

    this.ratJumpSprite = Sprite.from('rat_jump.png');
    this.ratJumpSprite.x = this.position.x;
    this.ratJumpSprite.y = this.position.y;
  }

  move(dt) {
    if (this.dead) {
      return;
    }

    // Calculate horizontal velocity
    this.velocity.x += (this.force.x / this.mass) * dt;

    // Cap horizontal velocity
    if (this.maxVelocity.x > 0 && Math.abs(this.velocity.x) > this.maxVelocity.x) {
      this.velocity.x = Math.sign(this.velocity.x) * this.maxVelocity.x;
    }
    // Calculate gravity only when airborne
    if (this.#airborne) {
      const lastVelocityY = this.velocity.y;

      // Calculate vertical velocity
      this.velocity.y += (this.force.y / this.mass) * dt;

      // Cap vertical velocity
      if (this.maxVelocity.y > 0 && Math.abs(this.velocity.y) > this.maxVelocity.y) {
        this.velocity.y = Math.sign(this.velocity.x) * this.maxVelocity.y;
      }

      // Debug
      if (this.velocity.y < 0) {
        this.jumpHeight += this.velocity.y * dt;
      }
      if (lastVelocityY < 0 && this.velocity.y >= 0) {
        console.debug('Max jump height: ', this.jumpHeight, lastVelocityY);
      }
    }

    // Backup current position
    this.lastPosition = this.position.clone();

    // Calculate new position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Set vertical position of the player container
    this.container.position.y = this.position.y;
  }

  jump() {
    if (this.dead || this.#airborne) {
      return;
    }

    this.jumpTimer = 0;
    this.lastVelocity = this.velocity.clone();
    this.velocity.y = this.power;
    this.airborne = true;

    // Debug
    this.jumpHeight = 0;
  }

  boost() {
    if (this.dead) {
      return;
    }

    this.boostTimer = 0;
    this.lastVelocity = this.velocity.clone();
    this.velocity.x = -this.power * 4;
    this.velocity.y = this.power * 3;
  }
}
