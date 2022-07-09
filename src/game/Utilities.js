export function random(min = 0, max = 1) {
  return min + Math.floor(Math.random() * (max - min));
}

export const API_URL = 'https://api.super-waka-land.com';
export const API_VERSION = '1.0';
export const CONTAINER = document.getElementById('app');
export const DEBUG = new URLSearchParams(window.location.search).has('DEBUG');
