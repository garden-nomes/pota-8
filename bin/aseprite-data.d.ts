export interface AsepriteData {
  frames: { [key: string]: Frame };
  meta: Meta;
}

export interface Frame {
  frame: Rect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: Rect;
  sourceSize: Size;
  duration: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Meta {
  app: string;
  version: string;
  image: string;
  format: string;
  size: Size;
  scale: string;
}
