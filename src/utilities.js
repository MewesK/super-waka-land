import { Rectangle } from "pixi.js";

export function random(min = 0, max = 1) {
  return min + Math.floor(Math.random() * (max - min));
}

export function intersect(a, b) {
  const x = Math.max(a.x, b.x);
  const num1 = Math.min(a.x + a.width, b.x + b.width);
  const y = Math.max(a.y, b.y);
  const num2 = Math.min(a.y + a.height, b.y + b.height);
  if (num1 >= x && num2 >= y) return new Rectangle(x, y, num1 - x, num2 - y);
  else return false;
}
