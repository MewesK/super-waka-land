/*!
 * Minimal theme switcher
 *
 * Pico.css - https://picocss.com
 * Copyright 2019-2022 - Licensed under MIT
 */
var themeSwitcher={_scheme:"auto",menuTarget:"details[role='list']",buttonsTarget:"a[data-theme-switcher]",buttonAttribute:"data-theme-switcher",rootAttribute:"data-theme",localStorageKey:"picoPreferedColorScheme",init:function(){this.scheme=this.schemeFromLocalStorage,this.initSwitchers()},get schemeFromLocalStorage(){return void 0!==window.localStorage&&null!==window.localStorage.getItem(this.localStorageKey)?window.localStorage.getItem(this.localStorageKey):this._scheme},get preferedColorScheme(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},initSwitchers:function(){var e=this;document.querySelectorAll(this.buttonsTarget).forEach((function(t){var o=e;t.addEventListener("click",(function(e){e.preventDefault(),o.scheme=t.getAttribute(o.buttonAttribute),document.querySelector(o.menuTarget).removeAttribute("open")}),!1)}))},set scheme(e){"auto"==e?"dark"==this.preferedColorScheme?this._scheme="dark":this._scheme="light":"dark"!=e&&"light"!=e||(this._scheme=e),this.applyScheme(),this.schemeToLocalStorage()},get scheme(){return this._scheme},applyScheme:function(){document.querySelector("html").setAttribute(this.rootAttribute,this.scheme)},schemeToLocalStorage:function(){void 0!==window.localStorage&&window.localStorage.setItem(this.localStorageKey,this.scheme)}};themeSwitcher.init();
//# sourceMappingURL=index.a9b9c24c.js.map
