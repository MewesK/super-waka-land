import { Loader } from 'pixi.js';

export let MusicType = {
  WAKALAKA: undefined,
};

export let SoundType = {
  BOOST: undefined,
  COIN: undefined,
  JUMP: undefined,
  POWER_UP: undefined,
};

export default class SoundManager {
  game;

  #currentMusic = null;
  #currentSound = null;

  constructor(game) {
    this.game = game;

    // Music
    MusicType.WAKALAKA = Loader.shared.resources.bgMusic.sound;
    MusicType.WAKALAKA.volume = game.DEFAULT_MUSIC_VOLUME;

    // Sound
    SoundType.BOOST = Loader.shared.resources.boostSound.sound;
    SoundType.BOOST.volume = game.DEFAULT_EFFECTS_VOLUME;

    SoundType.COIN = Loader.shared.resources.coinSound.sound;
    SoundType.COIN.volume = game.DEFAULT_EFFECTS_VOLUME;

    SoundType.JUMP = Loader.shared.resources.jumpSound.sound;
    SoundType.JUMP.volume = game.DEFAULT_EFFECTS_VOLUME;

    SoundType.POWER_UP = Loader.shared.resources.powerupSound.sound;
    SoundType.POWER_UP.volume = game.DEFAULT_EFFECTS_VOLUME;
  }

  playMusic(value = null) {
    if (value === this.#currentMusic) {
      return;
    } else if (this.#currentMusic) {
      this.#currentMusic.loop = false;
      this.#currentMusic.stop();
    }
    if (value) {
      value.loop = true;
      value.play();
    }
    this.#currentMusic = value;
  }

  getMusicVolume() {
    return MusicType.WAKALAKA.volume;
  }

  setMusicVolume(value) {
    MusicType.WAKALAKA.volume = value;
  }

  playSound(value) {
    if (value) {
      value.play();
    }
    this.#currentSound = value;
  }

  getSoundVolume() {
    return SoundType.POWER_UP.volume;
  }

  setSoundVolume(value) {
    SoundType.BOOST.volume = value;
    SoundType.COIN.volume = value;
    SoundType.JUMP.volume = value;
    SoundType.POWER_UP.volume = value;
  }

  reset() {
    this.playSound(null);
  }
}
