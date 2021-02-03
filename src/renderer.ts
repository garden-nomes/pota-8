import Font from "./Font";

export enum TextAlign {
  Left,
  Center,
  Right
}

export enum VerticalAlign {
  Top,
  Middle,
  Bottom
}

export type Color = [number, number, number] | number[];
export type PostprocessFunction = (c: Color, x: number, y: number) => Color;
export interface RenderOptionsObj {
  color: Color;
  depth?: number;
}
export type RenderOptions = RenderOptionsObj | Color;
export type ShapeOptions = (RenderOptionsObj & { fill?: boolean }) | Color;
export type TextOptions =
  | (RenderOptionsObj & {
      align?: TextAlign;
      verticalAlign?: VerticalAlign;
      width?: number;
    })
  | Color;

export type SpriteOptions = {
  depth?: number;
  flipX?: boolean;
  flipY?: boolean;
};

export function isColor(c: any): c is Color {
  return Array.isArray(c) && c.length === 3;
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Exposed API methods
 */
export interface RendererMethods {
  clear(color: Color): void;
  center(x: number, y: number): void;
  line(x0: number, y0: number, x1: number, y1: number, opt: RenderOptions): void;
  rect(x: number, y: number, w: number, h: number, opt: ShapeOptions): void;
  circle(x: number, y: number, r: number, opt: ShapeOptions): void;
  sprite(x: number, y: number, rect: Rect, opt?: SpriteOptions): void;
  pixel(x: number, y: number, opt: RenderOptions): void;
  text(text: string, x: number, y: number, opt: TextOptions): void;
  textWidth(text: string): number;
}

export default class Renderer implements RendererMethods {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  depthBuffer: Float32Array;
  pixels: ImageData;
  cameraX = 0;
  cameraY = 0;
  postprocess: PostprocessFunction | null = null;
  font: Font | null = null;

  constructor(private canvas: HTMLCanvasElement, private spriteSheet?: ImageData) {
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("Unable to create rendering context");
    }

    this.context = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.depthBuffer = new Float32Array(this.width * this.height);
    this.pixels = context.createImageData(this.width, this.height);
  }

  /**
   * Public API methods to hoist to global context
   */
  get methods(): RendererMethods {
    return {
      clear: this.clear.bind(this),
      center: this.center.bind(this),
      line: this.line.bind(this),
      rect: this.rect.bind(this),
      circle: this.circle.bind(this),
      sprite: this.sprite.bind(this),
      pixel: this.pixel.bind(this),
      text: this.text.bind(this),
      textWidth: this.textWidth.bind(this)
    };
  }

  resize() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.depthBuffer = new Float32Array(this.width * this.height);
    this.pixels = this.context.createImageData(this.width, this.height);
  }

  clear(color: Color) {
    this.depthBuffer.fill(Number.NEGATIVE_INFINITY);

    for (let i = 0; i < this.pixels.data.length; i += 4) {
      this.pixels.data[i] = color[0];
      this.pixels.data[i + 1] = color[1];
      this.pixels.data[i + 2] = color[2];
      this.pixels.data[i + 3] = 255;
    }
  }

  update() {
    if (this.postprocess) {
      for (let i = 0; i < this.pixels.data.length; i += 4) {
        const c = this.postprocess(
          [this.pixels.data[i], this.pixels.data[i + 1], this.pixels.data[i + 2]],
          Math.floor(i / 4 / this.width),
          (i / 4) % this.width
        );

        this.pixels.data[i] = c[0];
        this.pixels.data[i + 1] = c[1];
        this.pixels.data[i + 2] = c[2];
      }
    }

    this.context.putImageData(this.pixels, 0, 0);
  }

  pixel(x: number, y: number, opt: RenderOptions) {
    const [color, depth] = isColor(opt) ? [opt] : [opt.color, opt.depth];

    x = ~~x - this.cameraX;
    y = ~~y - this.cameraY;

    if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) return;

    const i = y * this.width + x;

    if (typeof depth !== "number" || this.depthBuffer[i] <= depth) {
      if (typeof depth === "number") this.depthBuffer[i] = depth;

      this.pixels.data[i * 4] = color[0];
      this.pixels.data[i * 4 + 1] = color[1];
      this.pixels.data[i * 4 + 2] = color[2];
      this.pixels.data[i * 4 + 3] = 255;
    }
  }

  center(x: number, y: number) {
    this.cameraX = ~~(x - this.width / 2);
    this.cameraY = ~~(y - this.height / 2);
  }

  sprite(x: number, y: number, rect: Rect, opt: SpriteOptions = {}): void {
    if (typeof this.spriteSheet === "undefined") {
      console.error("looks like you forgot to pass in the `spritesheet` option");
      return;
    }

    const { depth, flipX, flipY } = opt;

    for (let sx = 0; sx < rect.w; sx++) {
      for (let sy = 0; sy < rect.h; sy++) {
        const i = ((rect.y + sy) * this.spriteSheet.width + rect.x + sx) * 4;

        if (this.spriteSheet.data[i + 3] > 0) {
          const color = [
            this.spriteSheet.data[i],
            this.spriteSheet.data[i + 1],
            this.spriteSheet.data[i + 2]
          ];

          const dx = flipX ? x + rect.w - sx : x + sx;
          const dy = flipY ? y + rect.h - sy : y + sy;

          this.pixel(dx, dy, { color, depth });
        }
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, opt: RenderOptions) {
    // Bresenham's line algorithm, implementation from https://stackoverflow.com/a/55666538/7351962
    x0 = ~~x0;
    y0 = ~~y0;
    x1 = ~~x1;
    y1 = ~~y1;

    this.pixel(x0, y0, opt);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = dx - dy;
    while (x0 !== x1 || y0 !== y1) {
      const e2 = err << 1;

      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }

      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }

      this.pixel(x0, y0, opt);
    }
  }

  rect(x: number, y: number, w: number, h: number, opt: ShapeOptions) {
    if (isColor(opt) || opt.fill !== false) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          this.pixel(xx, yy, opt);
        }
      }
    } else {
      // TODO: stroke rect
    }
  }

  circle(x: number, y: number, r: number, opt: ShapeOptions) {
    x = ~~x;
    y = ~~y;
    r = ~~r;

    if (isColor(opt) || opt.fill !== false) {
      let [cx, cy] = [r, 0];
      let f = 1 - r;
      let ddfX = r * -2;
      let ddfY = 1;

      this.pixel(x, y + r, opt);
      this.pixel(x, y - r, opt);
      for (let rx = -r; rx <= r; rx++) {
        this.pixel(x + rx, y, opt);
      }

      while (cy < cx) {
        if (f >= 0) {
          cx--;
          ddfX += 2;
          f += ddfX;
        }

        cy++;
        ddfY += 2;
        f += ddfY;

        for (let rx = -cx; rx <= cx; rx++) {
          this.pixel(x + rx, y + cy, opt);
          this.pixel(x + rx, y - cy, opt);
        }

        for (let rx = -cy; rx <= cy; rx++) {
          this.pixel(x + rx, y + cx, opt);
          this.pixel(x + rx, y - cx, opt);
        }
      }
    } else {
      // TODO: stroke circle
    }
  }

  textWidth(text: string) {
    if (!this.font || !this.font.img) return 0;
    const { letters, spaceWidth } = this.font;

    let w = 0;
    for (const c of text) {
      if (c === " " || !letters[c]) {
        w += spaceWidth;
      } else {
        if (w > 0) w++;
        w += letters[c][2];
      }
    }

    return w;
  }

  private breakIntoLines(text: string, width: number) {
    if (!this.font || !this.font.img) return [""];
    const { letters, spaceWidth } = this.font;

    const lines = [];
    let currentLine = "";
    let w = 0;

    for (const c of text) {
      if (c === " " || !letters[c]) {
        if (w + spaceWidth < width && c !== "\n") {
          w += spaceWidth;
          currentLine += " ";
        } else {
          if (w + spaceWidth >= width && currentLine.includes(" ")) {
            const i = currentLine.lastIndexOf(" ");
            lines.push(currentLine.slice(0, i));
            currentLine = currentLine.slice(i + 1);
            w = 0;
            for (const c0 of currentLine) {
              w += letters[c0][2];
            }
            currentLine += " ";
            w += spaceWidth;
          } else {
            lines.push(currentLine);
            w = 0;
            currentLine = "";
          }
        }
      } else {
        if (currentLine.length) w++;
        currentLine += c;
        w += letters[c][2];
      }
    }

    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  }

  text(text: string, x: number, y: number, opt: TextOptions) {
    if (!this.font || !this.font.img) return;
    const { letters, img, spaceWidth, lineHeight } = this.font;

    const align = (!isColor(opt) && opt.align) || TextAlign.Left;
    const valign = (!isColor(opt) && opt.verticalAlign) || VerticalAlign.Top;

    let lines: string[];
    if (!isColor(opt) && opt.width) {
      lines = this.breakIntoLines(text, opt.width);
    } else {
      lines = text.split("\n");
    }

    const height = lines.length * lineHeight + lines.length - 1;
    if (valign === VerticalAlign.Bottom) {
      y -= height - 1;
    } else if (valign === VerticalAlign.Middle) {
      y -= Math.floor(height / 2);
    }

    for (const line of lines) {
      let left = x;
      if (align !== TextAlign.Left) {
        const w = this.textWidth(line);

        if (align === TextAlign.Center) {
          left -= Math.floor(w / 2);
        } else if (align === TextAlign.Right) {
          left -= w + 1;
        }
      }

      let cx = left;

      for (const c of line) {
        if (c === " " || !letters[c]) {
          cx += spaceWidth;
        } else {
          if (cx > left) cx++;

          const [letterX, letterY, w, h] = letters[c];
          for (let x0 = letterX; x0 < letterX + w; x0++) {
            for (let y0 = letterY; y0 < letterY + h; y0++) {
              const i = (y0 * img.width + x0) * 4;

              if (img.data[i + 3] > 0) {
                this.pixel(cx + x0 - letterX, y + y0 - letterY, opt);
              }
            }
          }

          cx += w;
        }
      }

      y += lineHeight + 1;
    }
  }
}
