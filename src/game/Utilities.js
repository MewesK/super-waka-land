export function random(min = 0, max = 1) {
  return min + Math.floor(Math.random() * (max - min));
}

const searchParams = new URLSearchParams(window.location.search);
export const DEBUG = searchParams.get('DEBUG') || searchParams.has('DEBUG');