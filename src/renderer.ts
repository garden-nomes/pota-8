export type Color = [number, number, number] | number[];

export interface RenderOptionsObj {
  color: Color;
  depth?: number;
}
export type RenderOptions = RenderOptionsObj | Color;
export type ShapeOptions = (RenderOptionsObj & { fill?: boolean }) | Color;

export function isColor(c: any): c is Color {
  return Array.isArray(c) && c.length === 3;
}

/**
 * Exposed API methods
 */
export interface RendererMethods {
  clear(color: Color): void;
  center(x: number, y: number): void;
  line(x0: number, y0: number, x1: number, y1: number, opt: RenderOptions): void;
  rect(x: number, y: number, w: number, h: number, opt: ShapeOptions): void;
  circle(x: number, y: number, r: number, opt: ShapeOptions): void;
}

export default class Renderer implements RendererMethods {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  depthBuffer: Float32Array;
  pixels: ImageData;
  cameraX = 0;
  cameraY = 0;

  constructor(private canvas: HTMLCanvasElement) {
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
      circle: this.circle.bind(this)
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
    this.context.putImageData(this.pixels, 0, 0);
  }

  set(x: number, y: number, opt: RenderOptions) {
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

  //   drawImage(
  //     data: ImageData,
  //     sx: number,
  //     sy: number,
  //     sw: number,
  //     sh: number,
  //     dx: number,
  //     dy: number,
  //     flipX = false,
  //     depth = Number.NEGATIVE_INFINITY,
  //     color?: Color
  //   ) {
  //     for (let y = 0; y < sh; y++) {
  //       for (let x = 0; x < sw; x++) {
  //         const i = ((sy + y) * data.width + (sx + x)) * 4;

  //         if (data.data[i + 3] > 0) {
  //           const c = color
  //             ? color
  //             : ([data.data[i], data.data[i + 1], data.data[i + 2]] as Color);

  //           this.set(flipX ? dx + sw - x : dx + x, dy + y, c, depth);
  //         }
  //       }
  //     }
  //   }

  line(x0: number, y0: number, x1: number, y1: number, opt: RenderOptions) {
    // Bresenham's line algorithm, implementation from https://stackoverflow.com/a/55666538/7351962
    x0 = ~~x0;
    y0 = ~~y0;
    x1 = ~~x1;
    y1 = ~~y1;

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

      this.set(x0, y0, opt);
    }
  }

  rect(x: number, y: number, w: number, h: number, opt: ShapeOptions) {
    if (isColor(opt) || opt.fill !== false) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          this.set(xx, yy, opt);
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

      this.set(x, y + r, opt);
      this.set(x, y - r, opt);
      for (let rx = -r; rx <= r; rx++) {
        this.set(x + rx, y, opt);
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
          this.set(x + rx, y + cy, opt);
          this.set(x + rx, y - cy, opt);
        }

        for (let rx = -cy; rx <= cy; rx++) {
          this.set(x + rx, y + cx, opt);
          this.set(x + rx, y - cx, opt);
        }
      }
    } else {
      // TODO: stroke circle
    }
  }
}
