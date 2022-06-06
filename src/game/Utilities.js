import { Rectangle } from "pixi.js";

export function random(min = 0, max = 1) {
  return min + Math.floor(Math.random() * (max - min));
}

export function intersect(rectangle1, rectangle2) {
  const x = Math.max(rectangle1.x, rectangle2.x);
  const num1 = Math.min(rectangle1.x + rectangle1.width, rectangle2.x + rectangle2.width);
  const y = Math.max(rectangle1.y, rectangle2.y);
  const num2 = Math.min(rectangle1.y + rectangle1.height, rectangle2.y + rectangle2.height);
  return (num1 >= x && num2 >= y) ? new Rectangle(x, y, num1 - x, num2 - y) : false;
}