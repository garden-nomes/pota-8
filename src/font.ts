import { loadImage } from "./util";

export default class Font {
  img: ImageData | null = null;
  letters: { [c: string]: [number, number, number, number] } = {};
  spaceWidth = 3;
  lineHeight;

  constructor(
    private src: string,
    private w: number,
    private h: number,
    private sequence: string
  ) {
    this.lineHeight = h;
  }

  async load() {
    loadImage(this.src).then(img => {
      this.img = img;

      let x = 0;
      let y = 0;
      this.letters = {};
      for (let c of this.sequence) {
        if (c === " ") {
          x += this.w;
          continue;
        }

        let left = x + this.w;
        let right = x;

        for (let x0 = x; x0 < x + this.w; x0++) {
          for (let y0 = y; y0 < y + this.h; y0++) {
            const i = (y0 * img.width + x0) * 4;

            if (img.data[i + 3] > 0) {
              if (x0 < left) left = x0;
              if (x0 > right) right = x0;
            }
          }
        }

        this.letters[c] = [left, y, right - left + 1, this.h];

        x += this.w;
        if (x >= img.width) {
          x = 0;
          y += this.h;
        }
      }
    });
  }
}
