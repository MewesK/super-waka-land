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

  constructor(game) {
    this.game = game;

    // Music
    MusicType.WAKALAKA = Loader.shared.resources.bgMusic.sound;
    this.setMusicVolume(game.DEFAULT_MUSIC_VOLUME);

    // Sound
    SoundType.BOOST = Loader.shared.resources.boostSound.sound;
    SoundType.COIN = Loader.shared.resources.coinSound.sound;
    SoundType.JUMP = Loader.shared.resources.jumpSound.sound;
    SoundType.POWER_UP = Loader.shared.resources.powerupSound.sound;
    this.setSoundVolume(game.DEFAULT_EFFECTS_VOLUME);
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
    return MusicType.WAKALAKA.volume !== 0
      ? Math.log(MusicType.WAKALAKA.volume) / Math.log(10) / 0.025 + 100
      : 0;
  }

  setMusicVolume(value) {
    MusicType.WAKALAKA.volume = value !== 0 ? Math.pow(10, 0.025 * (value - 100)) : 0;
  }

  playSound(value) {
    if (value) {
      value.play();
    }
  }

  getSoundVolume() {
    return SoundType.POWER_UP.volume !== 0
      ? Math.log(SoundType.POWER_UP.volume) / Math.log(10) / 0.025 + 100
      : 0;
  }

  setSoundVolume(value) {
    SoundType.BOOST.volume = value !== 0 ? Math.pow(10, 0.025 * (value - 100)) : 0;
    SoundType.COIN.volume = SoundType.BOOST.volume;
    SoundType.JUMP.volume = SoundType.BOOST.volume;
    SoundType.POWER_UP.volume = SoundType.BOOST.volume;
  }

  reset() {
    this.playSound(null);
  }
}
