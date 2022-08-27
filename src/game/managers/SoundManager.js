import { Loader } from 'pixi.js';

export let MusicType = {
  WAKALAKA: undefined,
};

export let EffectType = {
  BOOST: undefined,
  COIN: undefined,
  JUMP: undefined,
  POWER_UP: undefined,
};

export let VoiceType = {
  MAMA: undefined,
  WAO: undefined,
  DEATH: undefined,
  SCENE_CHARACTER: undefined,
  SCENE_GAME_OVER: undefined,
  SELECT_ORANGE: undefined,
  SELECT_RACCOON: undefined,
  SELECT_TUTEL: undefined,
  SELECT_RAT: undefined,
};

export default class SoundManager {
  CONSTANT = 0.025;

  game;

  #currentMusic = null;

  constructor(game) {
    this.game = game;

    // Music
    MusicType.WAKALAKA = Loader.shared.resources.bgMusic.sound;
    this.setMusicVolume(game.DEFAULT_MUSIC_VOLUME);

    // Effect
    EffectType.BOOST = Loader.shared.resources.boostEffect.sound;
    EffectType.COIN = Loader.shared.resources.coinEffect.sound;
    EffectType.JUMP = Loader.shared.resources.jumpEffect.sound;
    EffectType.POWER_UP = Loader.shared.resources.powerupEffect.sound;
    this.setEffectVolume(game.DEFAULT_EFFECT_VOLUME);

    // Voice
    VoiceType.MAMA = Loader.shared.resources.voiceMama.sound;
    VoiceType.WAO = Loader.shared.resources.voiceWao.sound;
    VoiceType.DEATH = Loader.shared.resources.voiceDeath.sound;
    VoiceType.SCENE_CHARACTER = Loader.shared.resources.sceneCharacter.sound;
    VoiceType.SCENE_GAME_OVER = Loader.shared.resources.sceneGameOver.sound;
    VoiceType.SELECT_ORANGE = Loader.shared.resources.voiceSelectOrange.sound;
    VoiceType.SELECT_RACCOON = Loader.shared.resources.voiceSelectRaccoon.sound;
    VoiceType.SELECT_TUTEL = Loader.shared.resources.voiceSelectTutel.sound;
    VoiceType.SELECT_RAT = Loader.shared.resources.voiceSelectRat.sound;
    this.setVoiceVolume(game.DEFAULT_VOICE_VOLUME);
  }

  percentageToVolume(value) {
    return value !== 0 ? Math.pow(10, this.CONSTANT * (value - 100)) : 0;
  }

  volumeToPercentage(value) {
    return value !== 0 ? Math.log(value) / Math.log(10) / this.CONSTANT + 100 : 0;
  }

  //
  // Music
  //

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
    return this.volumeToPercentage(MusicType.WAKALAKA.volume);
  }

  setMusicVolume(value) {
    MusicType.WAKALAKA.volume = this.percentageToVolume(value);
  }

  //
  // Effect
  //

  playEffect(value) {
    if (value) {
      value.play();
    }
  }

  getEffectVolume() {
    return this.volumeToPercentage(EffectType.POWER_UP.volume);
  }

  setEffectVolume(value) {
    EffectType.BOOST.volume = this.percentageToVolume(value);
    EffectType.COIN.volume = EffectType.BOOST.volume;
    EffectType.JUMP.volume = EffectType.BOOST.volume;
    EffectType.POWER_UP.volume = EffectType.BOOST.volume;
  }

  //
  // Voice
  //

  playVoice(value) {
    if (value) {
      value.play();
    }
  }

  getVoiceVolume() {
    return this.volumeToPercentage(VoiceType.ORANGE_SELECT.volume);
  }

  setVoiceVolume(value) {
    VoiceType.MAMA.volume = this.percentageToVolume(value);
    VoiceType.WAO.volume = VoiceType.MAMA.volume;
    VoiceType.DEATH.volume = VoiceType.MAMA.volume;
    VoiceType.SCENE_CHARACTER.volume = VoiceType.MAMA.volume;
    VoiceType.SCENE_GAME_OVER.volume = VoiceType.MAMA.volume;
    VoiceType.SELECT_ORANGE.volume = VoiceType.MAMA.volume;
    VoiceType.SELECT_RACCOON.volume = VoiceType.MAMA.volume;
    VoiceType.SELECT_TUTEL.volume = VoiceType.MAMA.volume;
    VoiceType.SELECT_RAT.volume = VoiceType.MAMA.volume;
  }
}
