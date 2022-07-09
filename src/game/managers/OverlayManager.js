import TitleOverlay from '../overlays/TitleOverlay';
import CharacterOverlay from '../overlays/CharacterOverlay';
import GameOverOverlay from '../overlays/GameOverOverlay';
import LeaderboardOverlay from '../overlays/LeaderboardOverlay';
import SettingsOverlay from '../overlays/SettingsOverlay';

export let OverlayType = {
  CHARACTER_SELECT: undefined,
  GAME_OVER: undefined,
  LEADERBOARD: undefined,
  SETTINGS: undefined,
  TITLE: undefined,
};

export default class OverlayManager {
  game;
  current = null;
  previous = null;

  constructor(game) {
    this.game = game;

    OverlayType.CHARACTER_SELECT = new CharacterOverlay(game);
    OverlayType.GAME_OVER = new GameOverOverlay(game);
    OverlayType.LEADERBOARD = new LeaderboardOverlay(game);
    OverlayType.SETTINGS = new SettingsOverlay(game);
    OverlayType.TITLE = new TitleOverlay(game);
  }

  async open(overlay, fade = true) {
    if (
      (this.current === overlay && this.current.opened) ||
      (this.current && !this.current.skippable)
    ) {
      return;
    }
    this.previous = this.current?.opened ? this.current : null;
    this.current = overlay;
    if (this.current && !this.current.opened) {
      if (this.current.beforeOpen()) {
        await this.current.open(fade);
        this.current.afterOpen();
      }
      if (this.current.opened) {
        this.game.hide();
      }
    }
  }

  async close(fade = true, force = false) {
    if (!this.current || (!this.current.skippable && !force)) {
      return;
    }
    if (this.current && this.current.opened) {
      if (force || this.current.beforeClose()) {
        await this.current.close(fade);
        if (!force) {
          this.current.afterClose();
        }
        if (!this.current?.opened) {
          this.game.show();
        }
      }
    }
  }

  update(dt) {
    if (this.current) {
      this.current.update(dt);
    }
  }

  reset() {
    this.close(false, true);
  }
}
