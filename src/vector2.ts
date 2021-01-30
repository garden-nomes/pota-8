function normalizeVectorInput(
  x: Vector2 | number[] | number,
  y?: number
): [number, number] {
  if (x instanceof Vector2) {
    return [x.x, x.y];
  } else if (x instanceof Array) {
    return [x[0], x[1]];
  } else {
    return [x, y || 0];
  }
}

function normalizeVectorOrScalarInput(
  x: Vector2 | number[] | number,
  y?: number
): [number, number] {
  if (x instanceof Vector2) {
    return [x.x, x.y];
  } else if (x instanceof Array) {
    return [x[0], x[1]];
  } else if (arguments.length === 1) {
    return [x, x];
  } else {
    return [x, y || 0];
  }
}

export function vec2(x: number, y: number) {
  return new Vector2(x, y);
}

export class Vector2 {
  constructor(public x: number, public y: number) {}

  add(other: Vector2 | number[]): Vector2;
  add(x: number, y: number): Vector2;
  add(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    return new Vector2(this.x + x, this.y + y);
  }

  sub(other: Vector2 | number[]): Vector2;
  sub(x: number, y: number): Vector2;
  sub(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    return new Vector2(this.x - x, this.y - y);
  }

  mult(other: Vector2 | number[] | number): Vector2;
  mult(x: number, y: number): Vector2;
  mult(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorOrScalarInput(x, y);
    return new Vector2(this.x * x, this.y * y);
  }

  div(other: Vector2 | number[] | number): Vector2;
  div(x: number, y: number): Vector2;
  div(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorOrScalarInput(x, y);
    return new Vector2(this.x / x, this.y * y);
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  dot(other: Vector2 | number[]): number;
  dot(x: number, y: number): number;
  dot(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    return this.x * x + this.y * y;
  }

  cross(other: Vector2 | number[]): number;
  cross(x: number, y: number): number;
  cross(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    return this.x * y - this.y * x;
  }

  dist(other: Vector2 | number[]): number;
  dist(x: number, y: number): number;
  dist(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distSq(other: Vector2 | number[]): number;
  distSq(x: number, y: number): number;
  distSq(x: Vector2 | number | number[], y?: number) {
    [x, y] = normalizeVectorInput(x, y);
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  normalize(): Vector2 {
    const d = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vector2(this.x / d, this.y / d);
  }
}
